import { describe, it, expect } from 'vitest'
import { validateCPF, validateCNPJ, validateEmail, getPasswordStrength } from '../validation'

describe('validateCPF', () => {
    it('aceita CPF valido (529.982.247-25)', () => {
        expect(validateCPF('52998224725')).toBe(true)
    })

    it('aceita CPF valido (111.444.777-35)', () => {
        expect(validateCPF('11144477735')).toBe(true)
    })

    it('rejeita CPF com digitos verificadores incorretos', () => {
        expect(validateCPF('52998224700')).toBe(false)
    })

    it('rejeita CPF com todos os digitos iguais (11111111111)', () => {
        expect(validateCPF('11111111111')).toBe(false)
    })

    it('rejeita CPF com todos os digitos iguais (00000000000)', () => {
        expect(validateCPF('00000000000')).toBe(false)
    })

    it('rejeita CPF com todos os digitos iguais (99999999999)', () => {
        expect(validateCPF('99999999999')).toBe(false)
    })

    it('rejeita CPF com tamanho incorreto (menos de 11)', () => {
        expect(validateCPF('1234567890')).toBe(false)
    })

    it('rejeita CPF com tamanho incorreto (mais de 11)', () => {
        expect(validateCPF('123456789012')).toBe(false)
    })

    it('rejeita CPF vazio', () => {
        expect(validateCPF('')).toBe(false)
    })
})

describe('validateCNPJ', () => {
    it('aceita CNPJ valido (11.222.333/0001-81)', () => {
        expect(validateCNPJ('11222333000181')).toBe(true)
    })

    it('aceita CNPJ valido formatado', () => {
        expect(validateCNPJ('11.222.333/0001-81')).toBe(true)
    })

    it('rejeita CNPJ com digitos verificadores incorretos', () => {
        expect(validateCNPJ('11222333000100')).toBe(false)
    })

    it('rejeita CNPJ com todos os digitos iguais (11111111111111)', () => {
        expect(validateCNPJ('11111111111111')).toBe(false)
    })

    it('rejeita CNPJ com todos os digitos iguais (00000000000000)', () => {
        expect(validateCNPJ('00000000000000')).toBe(false)
    })

    it('rejeita CNPJ com todos os digitos iguais (99999999999999)', () => {
        expect(validateCNPJ('99999999999999')).toBe(false)
    })

    it('rejeita CNPJ com tamanho incorreto', () => {
        expect(validateCNPJ('1122233300018')).toBe(false)
    })

    it('rejeita CNPJ vazio', () => {
        expect(validateCNPJ('')).toBe(false)
    })
})

describe('validateEmail', () => {
    it('aceita email valido simples', () => {
        expect(validateEmail('user@example.com')).toBe(true)
    })

    it('aceita email com subdominio', () => {
        expect(validateEmail('user@mail.example.com')).toBe(true)
    })

    it('aceita email com ponto no nome', () => {
        expect(validateEmail('first.last@example.com')).toBe(true)
    })

    it('aceita email com + no nome', () => {
        expect(validateEmail('user+tag@example.com')).toBe(true)
    })

    it('rejeita email sem @', () => {
        expect(validateEmail('userexample.com')).toBe(false)
    })

    it('rejeita email sem dominio', () => {
        expect(validateEmail('user@')).toBe(false)
    })

    it('rejeita email sem nome', () => {
        expect(validateEmail('@example.com')).toBe(false)
    })

    it('rejeita email com espaco', () => {
        expect(validateEmail('user @example.com')).toBe(false)
    })

    it('rejeita email sem TLD', () => {
        expect(validateEmail('user@example')).toBe(false)
    })

    it('rejeita string vazia', () => {
        expect(validateEmail('')).toBe(false)
    })
})

describe('getPasswordStrength', () => {
    it('senha vazia retorna Fraca (score 0)', () => {
        const result = getPasswordStrength('')
        expect(result.label).toBe('Fraca')
        expect(result.score).toBe(0)
    })

    it('senha curta (<8 chars) retorna Fraca', () => {
        const result = getPasswordStrength('abc')
        expect(result.label).toBe('Fraca')
        expect(result.score).toBeLessThanOrEqual(1)
    })

    it('senha com 8+ chars minusculas retorna Fraca (score 1)', () => {
        const result = getPasswordStrength('abcdefgh')
        expect(result.label).toBe('Fraca')
        expect(result.score).toBe(1)
    })

    it('senha com 8+ chars e numeros retorna Razoavel (score 2)', () => {
        const result = getPasswordStrength('abcdefg1')
        expect(result.label).toBe('Razoavel')
        expect(result.score).toBe(2)
    })

    it('senha com 8+ chars, maiusculas e minusculas retorna Razoavel (score 2)', () => {
        const result = getPasswordStrength('Abcdefgh')
        expect(result.label).toBe('Razoavel')
        expect(result.score).toBe(2)
    })

    it('senha com 8+ chars, maiusculas, minusculas e numeros retorna Media (score 3)', () => {
        const result = getPasswordStrength('Abcdefg1')
        expect(result.label).toBe('Media')
        expect(result.score).toBe(3)
    })

    it('senha com 12+ chars, maiusculas, minusculas e numeros retorna Forte (score 4)', () => {
        const result = getPasswordStrength('Abcdefghijk1')
        expect(result.label).toBe('Forte')
        expect(result.score).toBe(4)
    })

    it('senha com tudo (12+ chars, maiuscula, minuscula, numero, especial) retorna Forte (score 5)', () => {
        const result = getPasswordStrength('Abcdefghij1!')
        expect(result.label).toBe('Forte')
        expect(result.score).toBe(5)
    })

    it('retorna cores corretas para cada nivel', () => {
        expect(getPasswordStrength('abc').color).toBe('bg-red-500')
        expect(getPasswordStrength('abcdefg1').color).toBe('bg-yellow-500')
        expect(getPasswordStrength('Abcdefg1').color).toBe('bg-blue-500')
        expect(getPasswordStrength('Abcdefghij1!').color).toBe('bg-green-500')
    })

    it('retorna widths corretos para cada nivel', () => {
        expect(getPasswordStrength('abc').width).toBe('w-1/4')
        expect(getPasswordStrength('abcdefg1').width).toBe('w-1/2')
        expect(getPasswordStrength('Abcdefg1').width).toBe('w-3/4')
        expect(getPasswordStrength('Abcdefghij1!').width).toBe('w-full')
    })
})
