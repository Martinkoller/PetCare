import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;
console.log('PETCARE SERVER STARTING...');

app.use(cors());
app.use(express.json());


export const prisma = new PrismaClient();

// Basic Health Check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date() });
});

import authRoutes from './routes/auth.routes';
import clientRoutes from './routes/client.routes';
import petRoutes from './routes/pet.routes';
import appointmentRoutes from './routes/appointment.routes';

import serviceCatalogRoutes from './routes/service-catalog.routes';
import productRoutes from './routes/product.routes';
import boardingRoutes from './routes/boarding.routes';
import kennelRoutes from './routes/kennel.routes';
import organizationRoutes from './routes/organization.routes';
import templateRoutes from './routes/template.routes';
import professionalRoutes from './routes/professional.routes';
import taskRoutes from './routes/task.routes';
import whatsappRoutes from './routes/whatsapp.routes';
import hospitalizationRoutes from './routes/hospitalization.routes';
import clientInteractionRoutes from './routes/client-interaction.routes';
import saasRoutes from './routes/saas.routes';
import dashboardRoutes from './routes/dashboard.routes';
import portalRoutes from './routes/portal.routes';
import saleRoutes from './routes/sale.routes';
import { notificationSchedulerService } from './services/notification-scheduler.service';

app.use('/auth', authRoutes);
app.use('/clients', clientRoutes);
app.use('/pets', petRoutes);
app.use('/appointments', appointmentRoutes);
app.use('/services', serviceCatalogRoutes);
app.use('/products', productRoutes);
app.use('/boardings', boardingRoutes);
app.use('/kennels', kennelRoutes);
app.use('/organization', organizationRoutes);
app.use('/templates', templateRoutes);
app.use('/professionals', professionalRoutes);
app.use('/tasks', taskRoutes);
app.use('/whatsapp', whatsappRoutes);
app.use('/hospitalization', hospitalizationRoutes);
app.use('/api', clientInteractionRoutes);
app.use('/saas', saasRoutes);
app.use('/dashboard', dashboardRoutes);
app.use('/portal', portalRoutes);
app.use('/sales', saleRoutes);

app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Unhandled error:', err)
    res.status(500).json({ message: err?.message || 'Internal server error' })
})

process.on('uncaughtException', (err) => {
    console.error('uncaughtException:', err)
})

process.on('unhandledRejection', (reason) => {
    console.error('unhandledRejection:', reason)
})

export { app };

if (process.env.NODE_ENV !== 'test') {
    app.listen(port, () => {
        console.log(`Server running at http://localhost:${port}`);

        setInterval(() => {
            notificationSchedulerService.run();
        }, 5 * 60 * 1000);

        setTimeout(() => {
            notificationSchedulerService.run();
        }, 10000);
    });
}
