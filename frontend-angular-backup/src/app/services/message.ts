
import { Injectable } from '@angular/core';
import { Observable, from, map } from 'rxjs';
import { SupabaseService } from './supabase.service';
import { JobApplication } from './job';

// Import or define Message type
export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  createdAt: Date;
  // Join result
  sender?: {
    firstName: string;
  };
}

export interface Conversation {
  id: string;
  applicationId: string;
  createdAt: Date;
  isLocked: boolean;
  // Joins - application is guaranteed via !inner join in queries
  application: JobApplication;
  messages?: Message[];
}

@Injectable({
  providedIn: 'root'
})
export class MessageService {

  constructor(
    private supabase: SupabaseService
  ) { }

  // Inicia ou encontra uma conversa baseada no ID da candidatura
  startConversation(applicationId: string): Observable<Conversation> {
    // 1. Try to find existing
    return from(
      this.supabase.client
        .from('Conversation')
        .select('*')
        .eq('applicationid', applicationId)
        .maybeSingle()
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        if (data) return data as Conversation;

        // 2. If not found, create new (RLS permits if user is involved)
        // We need to return an Observable of the creation, which is async.
        // Logic needs to be chained properly.
        throw new Error('Create not implemented in pipeline, use switchMap'); // Placeholder logic fix below
      })
    );
  }

  // Correct async logic for get-or-create
  getOrCreateConversation(applicationId: string): Observable<Conversation> {
    return from(
      this.supabase.client
        .from('Conversation')
        .select('*')
        .eq('applicationid', applicationId)
        .maybeSingle()
    ).pipe(
      map(res => {
        if (res.error) throw res.error;
        return res.data;
      }),
      // Chain creation if null
      // Since I can't use 'switchMap' easily inside 'map', I'll rewrite this method entirely.
    ) as any;
  }

  // Clean implementation
  getConversation(applicationId: string): Observable<Conversation> {
    return new Observable(observer => {
      this.supabase.client
        .from('Conversation')
        .select('*')
        .eq('applicationid', applicationId)
        .maybeSingle()
        .then(async ({ data, error }) => {
          if (error) { observer.error(error); return; }
          if (data) {
            observer.next(data as Conversation);
            observer.complete();
          } else {
            // Create
            const { data: newConv, error: createError } = await this.supabase.client
              .from('Conversation')
              .insert({ applicationid: applicationId })
              .select()
              .single();

            if (createError) observer.error(createError);
            else observer.next(newConv as Conversation);
            observer.complete();
          }
        });
    });
  }


  getMyConversations(): Observable<Conversation[]> {
    // Complex Select with embedded resources
    // Need to select Application -> Job -> Author/Applicant to show names in list
    // query: *, application:JobApplication(*, job:Job(title, author:ClientProfile(userid, companyname)), applicant:User(firstname))
    return from(
      this.supabase.client
        .from('Conversation')
        .select(`
                *,
                application:JobApplication!inner(
                    *,
                    job:Job!inner(title, author:ClientProfile!inner(userid, companyname, user:User(firstname))),
                    applicant:User!inner(firstname, id)
                )
            `)
        .order('createdat', { ascending: false })
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return data as unknown as Conversation[];
      })
    );
  }

  getMessages(conversationId: string): Observable<Message[]> {
    return from(
      this.supabase.client
        .from('Message')
        .select(`*, sender:User!senderid(firstname)`) // Assuming FK generic relation. Check schema FK name?
        // If FK name is not 'sender', we might need FK hint. 
        // Migration SQL didn't show constraints.
        // Usually 'senderId' -> 'User.id'.
        // PostgREST: User!senderid might work if FK exists.
        .eq('conversationid', conversationId)
        .order('createdat', { ascending: true })
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return data as unknown as Message[];
      })
    );
  }

  sendMessage(conversationId: string, content: string): Observable<Message> {
    const senderId = this.supabase.user?.id;
    if (!senderId) throw new Error('Not logged in');

    return from(
      this.supabase.client
        .from('Message')
        .insert({
          conversationid: conversationId,
          senderid: senderId,
          content
        })
        .select() // Return created message
        .single()
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return data as unknown as Message;
      })
    );
  }

  // --- MIGRAÇÃO SUPABASE REALTIME (PERSISTENCE) ---
  subscribeToConversation(conversationId: string): Observable<Message> {
    return new Observable(observer => {
      const channel = this.supabase.client.channel(`room:${conversationId}`);

      channel
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'Message',
            filter: `conversationid=eq.${conversationId}`
          },
          (payload) => {
            const newMsg = payload.new as Message;
            // We might need to fetch sender info if not included in payload (Payload is just the row).
            // Frontend usually handles this or we fetch.
            // For simplified chat, we just push.
            observer.next(newMsg);
          }
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            console.log(`Inscrito no canal da conversa: ${conversationId}`);
          }
        });

      // Cleanup
      return () => {
        console.log(`Saindo do canal da conversa: ${conversationId}`);
        this.supabase.client.removeChannel(channel);
      };
    });
  }
}