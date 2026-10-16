import { eventRepository } from "../repositories/eventRepository";
import { CreateEventDto } from "../dtos/eventDto";
import { AppError } from "../utils/AppError";

export const eventService = {
  createEvent: async (dto: CreateEventDto, adminId: string) => {
    return eventRepository.create(dto, adminId);
  },

  getAllEvents: async () => {
    return eventRepository.findAll();
  },

  getEventById: async (id: string) => {
    const event = await eventRepository.findById(id);
    if (!event) {
      throw new AppError("Event not found", 404);
    }
    return event;
  },

  deleteEvent: async (id: string) => {
    const event = await eventRepository.findById(id);
    if (!event) {
      throw new AppError("Event not found", 404);
    }
    await eventRepository.delete(id);
  },
};
