import { z } from "zod";
import { contactRepository } from "@/repositories/contact.repository";
import { trigger } from "@/lib/pusher";

export const contactInputSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  email: z.string().email("Invalid email"),
  subject: z.string().max(200).optional().default(""),
  body: z.string().min(1, "Message is required").max(5000),
});

export const contactService = {
  async submit(input: z.infer<typeof contactInputSchema>) {
    const message = await contactRepository.create({
      name: input.name.trim(),
      email: input.email.trim().toLowerCase(),
      subject: input.subject?.trim() || "General Inquiry",
      body: input.body.trim(),
    });

    trigger("private-admin", "new-contact-message", {
      id: message.id,
      name: message.name,
      email: message.email,
      subject: message.subject,
      createdAt: message.createdAt,
    });

    trigger("private-admin", "stats-update", {});

    return message;
  },

  async list(page = 1, limit = 20) {
    return contactRepository.list(page, limit);
  },
};
