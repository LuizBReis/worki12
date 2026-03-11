/**
 * Funcoes de validacao reutilizaveis para CPF, CNPJ, email e forca de senha.
 */

/** Valida CPF (somente digitos, 11 chars) */
export function validateCPF(cpf: string): boolean {
    if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;
    const d = cpf.split('').map(Number);
    let s = 0;
    for (let i = 0; i < 9; i++) s += d[i] * (10 - i);
    let r = (s * 10) % 11; if (r === 10) r = 0;
    if (r !== d[9]) return false;
    s = 0;
    for (let i = 0; i < 10; i++) s += d[i] * (11 - i);
    r = (s * 10) % 11; if (r === 10) r = 0;
    return r === d[10];
}

/** Valida CNPJ (aceita com ou sem formatacao) */
export function validateCNPJ(cnpj: string): boolean {
    const clean = cnpj.replace(/\D/g, '');
    if (clean.length !== 14 || /^(\d)\1{13}$/.test(clean)) return false;
    const d = clean.split('').map(Number);
    const w1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    const w2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    let s = 0;
    for (let i = 0; i < 12; i++) s += d[i] * w1[i];
    let r = s % 11;
    if ((r < 2 ? 0 : 11 - r) !== d[12]) return false;
    s = 0;
    for (let i = 0; i < 13; i++) s += d[i] * w2[i];
    r = s % 11;
    return (r < 2 ? 0 : 11 - r) === d[13];
}

export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Valida formato de email */
export function validateEmail(email: string): boolean {
    return EMAIL_REGEX.test(email);
}

export interface PasswordStrength {
    label: string;
    color: string;
    width: string;
    score: number;
}

/** Avalia forca da senha */
export function getPasswordStrength(pw: string): PasswordStrength {
    let score = 0;
    if (pw.length >= 8) score++;
    if (pw.length >= 12) score++;
    if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++;
    if (/\d/.test(pw)) score++;
    if (/[^a-zA-Z0-9]/.test(pw)) score++;

    if (score <= 1) return { label: 'Fraca', color: 'bg-red-500', width: 'w-1/4', score };
    if (score <= 2) return { label: 'Razoavel', color: 'bg-yellow-500', width: 'w-1/2', score };
    if (score <= 3) return { label: 'Media', color: 'bg-blue-500', width: 'w-3/4', score };
    return { label: 'Forte', color: 'bg-green-500', width: 'w-full', score };
}
