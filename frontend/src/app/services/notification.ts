import { Injectable } from '@angular/core';
import Swal from 'sweetalert2';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  success(title: string, text?: string) {
    return Swal.fire({
      icon: 'success',
      title,
      text: text || '',
      confirmButtonColor: '#34c759'
    });
  }

  error(title: string, text?: string) {
    return Swal.fire({
      icon: 'error',
      title,
      text: text || '',
      confirmButtonColor: '#d33'
    });
  }

  info(title: string, text?: string) {
    return Swal.fire({
      icon: 'info',
      title,
      text: text || '',
      confirmButtonColor: '#34c759'
    });
  }

  warn(title: string, text?: string) {
    return Swal.fire({
      icon: 'warning',
      title,
      text: text || '',
      confirmButtonColor: '#34c759'
    });
  }

  confirm(options: {
    title?: string;
    text?: string;
    confirmText?: string;
    cancelText?: string;
    confirmColor?: string;
    cancelColor?: string;
  } = {}) {
    const {
      title = 'Tem certeza?',
      text = '',
      confirmText = 'Confirmar',
      cancelText = 'Cancelar',
      confirmColor = '#34c759',
      cancelColor = '#999'
    } = options;

    return Swal.fire({
      title,
      text,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: confirmText,
      cancelButtonText: cancelText,
      confirmButtonColor: confirmColor,
      cancelButtonColor: cancelColor
    }).then(res => res.isConfirmed);
  }
}