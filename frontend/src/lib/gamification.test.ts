import { describe, it, expect } from 'vitest'
import { calculateLevel, LEVELS } from './gamification'

describe('calculateLevel', () => {
  it('retorna nivel 1 para 0 XP', () => {
    expect(calculateLevel(0)).toBe(1)
  })

  it('retorna nivel 1 para XP abaixo de 100', () => {
    expect(calculateLevel(50)).toBe(1)
    expect(calculateLevel(99)).toBe(1)
  })

  it('retorna nivel 2 para 100 XP', () => {
    expect(calculateLevel(100)).toBe(2)
  })

  it('retorna nivel 3 para 300 XP', () => {
    expect(calculateLevel(300)).toBe(3)
  })

  it('retorna nivel correto para XP entre niveis', () => {
    expect(calculateLevel(250)).toBe(2)
    expect(calculateLevel(500)).toBe(3)
    expect(calculateLevel(999)).toBe(4)
  })

  it('retorna nivel 10 para XP maximo', () => {
    expect(calculateLevel(4500)).toBe(10)
    expect(calculateLevel(9999)).toBe(10)
  })

  it('retorna nivel 1 para XP negativo', () => {
    expect(calculateLevel(-10)).toBe(1)
  })
})

describe('LEVELS', () => {
  it('tem 10 niveis', () => {
    expect(LEVELS).toHaveLength(10)
  })

  it('niveis estao em ordem crescente de XP', () => {
    for (let i = 1; i < LEVELS.length; i++) {
      expect(LEVELS[i].minXp).toBeGreaterThan(LEVELS[i - 1].minXp)
    }
  })

  it('nivel 1 comeca com 0 XP', () => {
    expect(LEVELS[0]).toEqual({ level: 1, minXp: 0 })
  })
})
