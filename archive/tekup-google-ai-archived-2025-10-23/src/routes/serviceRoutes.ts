import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAuth } from '../middleware/authMiddleware';

const prisma = new PrismaClient();
const router = Router();

// Get all services
router.get('/', async (req, res) => {
  try {
    const services = await prisma.service.findMany();
    res.json(services);
  } catch (error) {
    console.error('Error fetching services:', error);
    res.status(500).json({ error: 'Failed to fetch services' });
  }
});

// Get a single service by ID
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const service = await prisma.service.findUnique({
      where: { id },
    });
    if (service) {
      res.json(service);
    } else {
      res.status(404).json({ error: 'Service not found' });
    }
  } catch (error) {
    console.error(`Error fetching service ${id}:`, error);
    res.status(500).json({ error: 'Failed to fetch service' });
  }
});

// Create a new service
router.post('/', requireAuth, async (req, res) => {
  const { name, description, price, duration } = req.body;
  try {
    const newService = await prisma.service.create({
      data: {
        name,
        description,
        price,
        duration,
      },
    });
    res.status(201).json(newService);
  } catch (error) {
    console.error('Error creating service:', error);
    res.status(500).json({ error: 'Failed to create service' });
  }
});

// Update a service
router.put('/:id', requireAuth, async (req, res) => {
  const { id } = req.params;
  const { name, description, price, duration } = req.body;
  try {
    const updatedService = await prisma.service.update({
      where: { id },
      data: {
        name,
        description,
        price,
        duration,
      },
    });
    res.json(updatedService);
  } catch (error) {
    console.error(`Error updating service ${id}:`, error);
    res.status(500).json({ error: 'Failed to update service' });
  }
});

// Delete a service
router.delete('/:id', requireAuth, async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.service.delete({
      where: { id },
    });
    res.status(204).send();
  } catch (error) {
    console.error(`Error deleting service ${id}:`, error);
    res.status(500).json({ error: 'Failed to delete service' });
  }
});

export default router;