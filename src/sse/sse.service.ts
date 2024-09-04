import { Injectable } from '@nestjs/common';
import { Observable, Subject } from 'rxjs';

export interface MessageEvent {
  data: string | object;
  id?: string;
  type?: string;
  retry?: number;
}

interface UserSseDetails {
  subject: Subject<MessageEvent>;
  created: number;
}
@Injectable()
export class SseService {
  // deleet if user not connected anymore
  public static eventsMap = new Map<string, UserSseDetails>();
  private readonly eventValidityDuration = 2 * 60 * 60 * 1000; // 2 Stunden in Millisekunden

  registerUserSse(userId: string): Observable<MessageEvent> {
    if (!SseService.eventsMap.has(userId)) {
      const subject = new Subject<MessageEvent>();
      const userDetails: UserSseDetails = { subject, created: Date.now() };
      SseService.eventsMap.set(userId, userDetails);
    }
    return SseService.eventsMap.get(userId)!.subject.asObservable();
  }

  sendEventToUser(userId: string, event: MessageEvent): string {
    const userDetails = SseService.eventsMap.get(userId);

    if (userDetails) {
      // Benutzer ist registriert, sende das Ereignis
      userDetails.subject.next(event);
      return 'Event sent successfully';
    } else {
      // Benutzer ist nicht registriert
      return 'User not registered';
    }
  }

  deleteUserIdFromMap(userId: string) {
    SseService.eventsMap.delete(userId);
  }
}
