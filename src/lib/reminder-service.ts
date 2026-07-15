// src/lib/reminder-service.ts

interface CoachingSession {
  id: string;
  coachName: string;
  scheduledAt: string;
  duration: number;
  sessionType: string;
  meetingLink: string;
}

interface Reminder {
  sessionId: string;
  type: 'email' | 'sms' | 'push';
  scheduledAt: Date;
  message: string;
}

export class ReminderService {
  private reminders: Map<string, Reminder> = new Map();

  scheduleReminders(session: CoachingSession, playerPhone: string, playerEmail: string) {
    const reminders: Reminder[] = [
      {
        sessionId: session.id,
        type: 'sms',
        scheduledAt: new Date(new Date(session.scheduledAt).getTime() - 24 * 60 * 60 * 1000),
        message: this.buildSmsReminder(session, false),
      },
      {
        sessionId: session.id,
        type: 'sms',
        scheduledAt: new Date(new Date(session.scheduledAt).getTime() - 60 * 60 * 1000),
        message: this.buildSmsReminder(session, true),
      },
      {
        sessionId: session.id,
        type: 'email',
        scheduledAt: new Date(new Date(session.scheduledAt).getTime() - 24 * 60 * 60 * 1000),
        message: this.buildEmailReminder(session),
      },
    ];

    reminders.forEach(reminder => {
      this.reminders.set(`${session.id}_${reminder.type}_${reminder.scheduledAt.getTime()}`, reminder);
      this.scheduleReminder(reminder, playerPhone, playerEmail);
    });
  }

  private scheduleReminder(reminder: Reminder, phone: string, email: string) {
    const now = new Date();
    const delay = reminder.scheduledAt.getTime() - now.getTime();

    if (delay > 0) {
      setTimeout(() => {
        this.sendReminder(reminder, phone, email);
      }, delay);
    } else {
      this.sendReminder(reminder, phone, email);
    }
  }

  private async sendReminder(reminder: Reminder, phone: string, email: string) {
    try {
      if (reminder.type === 'sms') {
        await this.sendSms(phone, reminder.message);
      } else if (reminder.type === 'email') {
        await this.sendEmail(email, reminder.message);
      } else {
        await this.sendPush(reminder.message);
      }
    } catch (error) {
      console.error('Failed to send reminder:', error);
    }
  }

  private async sendSms(phone: string, message: string) {
    console.log(`Sending SMS to ${phone}: ${message}`);
  }

  private async sendEmail(email: string, message: string) {
    console.log(`Sending email to ${email}: ${message}`);
  }

  private async sendPush(message: string) {
    console.log(`Sending push notification: ${message}`);
  }

  private buildSmsReminder(session: CoachingSession, urgent: boolean): string {
    const time = new Date(session.scheduledAt).toLocaleTimeString('en-ZA', {
      hour: '2-digit',
      minute: '2-digit',
    });
    const date = new Date(session.scheduledAt).toLocaleDateString('en-ZA', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });

    if (urgent) {
      return `⚡ REMINDER: Your coaching session with ${session.coachName} starts in 1 hour at ${time} (${date}). Join: ${session.meetingLink}`;
    }

    return `📚 REMINDER: You have a coaching session with ${session.coachName} tomorrow at ${time} (${date}). Get ready!`;
  }

  private buildEmailReminder(session: CoachingSession): string {
    return `
      <h2>📚 Coaching Session Reminder</h2>
      <p><strong>Coach:</strong> ${session.coachName}</p>
      <p><strong>Date:</strong> ${new Date(session.scheduledAt).toLocaleDateString('en-ZA', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })}</p>
      <p><strong>Time:</strong> ${new Date(session.scheduledAt).toLocaleTimeString('en-ZA', {
        hour: '2-digit',
        minute: '2-digit',
      })}</p>
      <p><strong>Duration:</strong> ${session.duration} minutes</p>
      <p><strong>Session Type:</strong> ${session.sessionType}</p>
      <p><strong>Meeting Link:</strong> <a href="${session.meetingLink}">${session.meetingLink}</a></p>
      <hr>
      <p>💡 <strong>Tips:</strong> Join 5 minutes early, prepare your questions, have your equipment ready.</p>
    `;
  }
}

export const reminderService = new ReminderService();