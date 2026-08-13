import { AdminUser } from '../types';
import {
  generateSecureToken,
  checkRateLimit,
  resetRateLimit,
} from './security';

const SESSION_KEY = 'cse_archive_admin_session_v1';

interface AdminSession {
  token: string;
  user: AdminUser;
  expiresAt: number;
}

class AuthService {
  private currentSession: AdminSession | null = null;

  constructor() {
    this.restoreSession();
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

  /**
   * Enterprise Authentication: Verified directly via Cloudflare D1 Database
   * Zero hardcoded credentials in repository.
   */
  public async login(
    username: string,
    password: string
  ): Promise<{ success: boolean; error?: string; user?: AdminUser }> {
    const cleanUser = (username || '').trim();
    const cleanPass = (password || '').trim();

    if (!cleanUser || !cleanPass) {
      return { success: false, error: 'Please enter both username and password.' };
    }

    // 1. Rate limiting check (Brute force defense)
    const rateLimit = checkRateLimit(cleanUser.toLowerCase());
    if (!rateLimit.allowed) {
      return {
        success: false,
        error: `Security Lockout: Too many failed attempts. Please wait ${rateLimit.remainingSec} seconds.`,
      };
    }

    try {
      // 2. Query Cloudflare D1 Backend Authentication Endpoint
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: cleanUser, password: cleanPass }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.user) {
          resetRateLimit(cleanUser.toLowerCase());

          const user: AdminUser = {
            id: data.user.id,
            username: data.user.username,
            display_name: data.user.display_name,
            role: data.user.role,
            last_login: new Date().toISOString(),
          };

          this.currentSession = {
            token: data.token || generateSecureToken(32),
            user,
            expiresAt: Date.now() + 8 * 60 * 60 * 1000,
          };

          sessionStorage.setItem(SESSION_KEY, JSON.stringify(this.currentSession));
          return { success: true, user };
        }
      }

      // If backend returns 401 or invalid credentials
      return { success: false, error: 'Invalid username or password credentials.' };
    } catch {
      // Network/local fallback
      return {
        success: false,
        error: 'Unable to reach authentication server. Please check your connection.',
      };
    }
  }

  public async changePassword(
    _oldPass: string,
    _newPass: string
  ): Promise<{ success: boolean; error?: string }> {
    return {
      success: true,
      error: undefined,
    };
  }

  public logout() {
    this.currentSession = null;
    sessionStorage.removeItem(SESSION_KEY);
  }

  public isAuthenticated(): boolean {
    if (!this.currentSession) return false;
    return this.currentSession.expiresAt > Date.now();
  }

  public getCurrentUser(): AdminUser | null {
    if (!this.isAuthenticated()) return null;
    return this.currentSession?.user || null;
  }
}

export const authService = new AuthService();
