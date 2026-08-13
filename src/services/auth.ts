import { AdminUser } from '../types';
import {
  hashPassword,
  verifyPassword,
  generateSecureToken,
  checkRateLimit,
  resetRateLimit,
} from './security';

const SESSION_KEY = 'cse_archive_admin_session_v1';
const ADMIN_USER_KEY = 'cse_archive_admin_user_v1';

interface StoredAdmin {
  id: string;
  username: string;
  passwordHash: string;
  salt: string;
  displayName: string;
  role: 'super_admin' | 'admin';
}

interface AdminSession {
  token: string;
  user: AdminUser;
  expiresAt: number;
}

class AuthService {
  private currentSession: AdminSession | null = null;

  constructor() {
    this.initAdmin();
    this.restoreSession();
  }

  // Initialize default admin with secure salt & hash if not present
  private async initAdmin() {
    const existing = localStorage.getItem(ADMIN_USER_KEY);
    if (!existing) {
      // Default: username = "admin", password = "admin123"
      const { hashHex, saltHex } = await hashPassword('admin123');
      const defaultAdmin: StoredAdmin = {
        id: 'admin-001',
        username: 'admin',
        passwordHash: hashHex,
        salt: saltHex,
        displayName: 'Department Administrator',
        role: 'super_admin',
      };
      localStorage.setItem(ADMIN_USER_KEY, JSON.stringify(defaultAdmin));
    }
  }

  private restoreSession() {
    try {
      const saved = sessionStorage.getItem(SESSION_KEY);
      if (saved) {
        const session: AdminSession = JSON.parse(saved);
        if (session.expiresAt > Date.now()) {
          this.currentSession = session;
        } else {
          sessionStorage.removeItem(SESSION_KEY);
        }
      }
    } catch {
      sessionStorage.removeItem(SESSION_KEY);
    }
  }

  public async login(username: string, password: string): Promise<{ success: boolean; error?: string; user?: AdminUser }> {
    // 1. Rate limiting check (Brute force protection)
    const rateLimit = checkRateLimit(username.toLowerCase());
    if (!rateLimit.allowed) {
      return {
        success: false,
        error: `Security Lock: Too many failed login attempts. Please wait ${rateLimit.remainingSec} seconds.`,
      };
    }

    // 2. Lookup admin
    const storedStr = localStorage.getItem(ADMIN_USER_KEY);
    if (!storedStr) {
      await this.initAdmin();
    }
    const admin: StoredAdmin = JSON.parse(localStorage.getItem(ADMIN_USER_KEY)!);

    // 3. Verify username & password hash
    if (admin.username.toLowerCase() !== username.trim().toLowerCase()) {
      return { success: false, error: 'Invalid username or password credentials.' };
    }

    const isValid = await verifyPassword(password, admin.passwordHash, admin.salt);
    if (!isValid) {
      return { success: false, error: 'Invalid username or password credentials.' };
    }

    // Reset rate limiter upon successful login
    resetRateLimit(username.toLowerCase());

    // 4. Create secure session (valid for 8 hours)
    const sessionToken = generateSecureToken(32);
    const user: AdminUser = {
      id: admin.id,
      username: admin.username,
      display_name: admin.displayName,
      role: admin.role,
      last_login: new Date().toISOString(),
    };

    this.currentSession = {
      token: sessionToken,
      user,
      expiresAt: Date.now() + 8 * 60 * 60 * 1000,
    };

    sessionStorage.setItem(SESSION_KEY, JSON.stringify(this.currentSession));

    return { success: true, user };
  }

  public logout(): void {
    this.currentSession = null;
    sessionStorage.removeItem(SESSION_KEY);
  }

  public isAuthenticated(): boolean {
    if (!this.currentSession) return false;
    if (this.currentSession.expiresAt <= Date.now()) {
      this.logout();
      return false;
    }
    return true;
  }

  public getCurrentUser(): AdminUser | null {
    if (!this.isAuthenticated()) return null;
    return this.currentSession?.user || null;
  }

  public async changePassword(oldPass: string, newPass: string): Promise<{ success: boolean; error?: string }> {
    if (!this.isAuthenticated()) {
      return { success: false, error: 'Unauthorized: Session expired.' };
    }

    const storedStr = localStorage.getItem(ADMIN_USER_KEY);
    if (!storedStr) return { success: false, error: 'Admin record missing.' };

    const admin: StoredAdmin = JSON.parse(storedStr);
    const isOldValid = await verifyPassword(oldPass, admin.passwordHash, admin.salt);
    if (!isOldValid) {
      return { success: false, error: 'Current password is incorrect.' };
    }

    if (newPass.length < 6) {
      return { success: false, error: 'New password must be at least 6 characters.' };
    }

    const { hashHex, saltHex } = await hashPassword(newPass);
    admin.passwordHash = hashHex;
    admin.salt = saltHex;
    localStorage.setItem(ADMIN_USER_KEY, JSON.stringify(admin));

    return { success: true };
  }
}

export const authService = new AuthService();
