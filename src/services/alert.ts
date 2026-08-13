import Swal from 'sweetalert2';

// Base Dark Glass Theme for SweetAlert2
const DarkSwal = Swal.mixin({
  background: '#090d16',
  color: '#f8fafc',
  backdrop: `rgba(3, 7, 18, 0.85) backdrop-filter: blur(8px)`,
  customClass: {
    popup: 'border border-slate-800 rounded-3xl shadow-2xl shadow-black/80',
    title: 'text-lg font-bold text-white tracking-tight',
    htmlContainer: 'text-xs text-slate-300 leading-relaxed',
    confirmButton: 'px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 transition-all border border-indigo-500 mx-1.5',
    cancelButton: 'px-4 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all border border-slate-700 mx-1.5',
    denyButton: 'px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/30 transition-all border border-rose-500 mx-1.5',
  },
  buttonsStyling: false,
});

/**
 * Modern SweetAlert Confirmation Dialog
 */
export async function showConfirmAlert(options: {
  title: string;
  text: string;
  icon?: 'warning' | 'info' | 'question' | 'error' | 'success';
  confirmButtonText?: string;
  cancelButtonText?: string;
  isDestructive?: boolean;
}): Promise<boolean> {
  const result = await DarkSwal.fire({
    title: options.title,
    text: options.text,
    icon: options.icon || 'question',
    showCancelButton: true,
    confirmButtonText: options.confirmButtonText || 'Confirm',
    cancelButtonText: options.cancelButtonText || 'Cancel',
    reverseButtons: true,
    customClass: {
      popup: 'border border-slate-800 rounded-3xl shadow-2xl shadow-black/80',
      title: 'text-lg font-bold text-white tracking-tight',
      htmlContainer: 'text-xs text-slate-300 leading-relaxed',
      confirmButton: options.isDestructive
        ? 'px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/30 transition-all border border-rose-500 mx-1.5'
        : 'px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 transition-all border border-indigo-500 mx-1.5',
      cancelButton: 'px-4 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all border border-slate-700 mx-1.5',
    },
  });

  return result.isConfirmed;
}

/**
 * Delete Confirmation with SweetAlert
 */
export async function showDeleteConfirmAlert(itemName: string, customMessage?: string): Promise<boolean> {
  return showConfirmAlert({
    title: `Delete ${itemName}?`,
    text: customMessage || `Are you sure you want to delete this ${itemName.toLowerCase()}? This action cannot be undone.`,
    icon: 'warning',
    confirmButtonText: 'Yes, Delete',
    cancelButtonText: 'Cancel',
    isDestructive: true,
  });
}

/**
 * Success Alert
 */
export async function showSuccessAlert(title: string, text: string): Promise<void> {
  await DarkSwal.fire({
    icon: 'success',
    title,
    text,
    timer: 2200,
    showConfirmButton: false,
  });
}

/**
 * Error Alert
 */
export async function showErrorAlert(title: string, text: string): Promise<void> {
  await DarkSwal.fire({
    icon: 'error',
    title,
    text,
    confirmButtonText: 'Dismiss',
  });
}

export default DarkSwal;
