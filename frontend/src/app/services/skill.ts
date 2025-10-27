import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

export interface Skill {
  id: string;
  name: string;
}

// Fallback local para quando a API não retornar sugestões
const DEFAULT_SUGGESTED_SKILLS: Skill[] = [
  { id: 'fallback:atendimento-ao-cliente', name: 'Atendimento ao Cliente' },
  { id: 'fallback:comunicacao-interpessoal', name: 'Comunicação Interpessoal' },
  { id: 'fallback:vendas-e-persuasao', name: 'Vendas e Persuasão' },
  { id: 'fallback:trabalho-em-equipe', name: 'Trabalho em Equipe' },
  { id: 'fallback:proatividade', name: 'Proatividade' },
  { id: 'fallback:flexibilidade-e-adaptabilidade', name: 'Flexibilidade e Adaptabilidade' },
  { id: 'fallback:resiliencia', name: 'Resiliência' },
  { id: 'fallback:multitarefa', name: 'Multitarefa' },
  { id: 'fallback:lideranca', name: 'Liderança' },
  { id: 'fallback:negociacao', name: 'Negociação' },
  { id: 'fallback:empatia', name: 'Empatia' },
  { id: 'fallback:organizacao', name: 'Organização' },
  { id: 'fallback:resolucao-de-conflitos', name: 'Resolução de Conflitos' },
  { id: 'fallback:gerenciamento-de-tempo', name: 'Gerenciamento de Tempo' },
  { id: 'fallback:operacao-de-caixa', name: 'Operação de Caixa' },
  { id: 'fallback:servico-de-garcom-garconete', name: 'Serviço de Garçom / Garçonete' },
  { id: 'fallback:bartending-coquetelaria', name: 'Bartending / Coquetelaria' },
  { id: 'fallback:barista-preparo-de-cafe', name: 'Barista / Preparo de Café' },
  { id: 'fallback:recepcao-de-eventos', name: 'Recepção de Eventos' },
  { id: 'fallback:promocao-de-eventos', name: 'Promoção de Eventos' },
  { id: 'fallback:fotografia', name: 'Fotografia' },
  { id: 'fallback:ingles-fluente', name: 'Inglês Fluente' },
  { id: 'fallback:espanhol-fluente', name: 'Espanhol Fluente' }
];

@Injectable({
  providedIn: 'root'
})
export class SkillService {
  private apiUrl = '/api/skills';

  constructor(private http: HttpClient) { }

  getSuggestedSkills(): Observable<Skill[]> {
    return this.http.get<Skill[]>(`${this.apiUrl}/suggestions`).pipe(
      map((skills: Skill[] | null) => {
        const cleaned = (skills || []).filter(s => !!s.name && s.name.trim().length > 0);
        return cleaned.length > 0 ? cleaned : DEFAULT_SUGGESTED_SKILLS;
      }),
      catchError((_err) => of(DEFAULT_SUGGESTED_SKILLS))
    );
  }
}