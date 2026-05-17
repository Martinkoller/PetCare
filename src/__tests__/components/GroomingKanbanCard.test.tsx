import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { GroomingKanbanCard } from '@/pages/grooming/GroomingKanbanCard';

const noop = () => {};
const noopE = (_e: React.MouseEvent) => {};

const baseApt = {
  id: 'apt-1',
  organizationId: 'org-1',
  petId: 'pet-1',
  serviceType: 'grooming',
  date: '2026-05-15T10:00:00',
  duration: 60,
  status: 'in_progress',
  priority: 'normal',
  appointmentType: 'scheduled',
  tutorNotified: false,
  awaitingWhatsappReply: false,
  serviceItems: [{ itemType: 'main', name: 'Banho e Tosa', duration: 60, checked: false, mandatory: false }],
  groomingStatus: 'stage-1',
  checkinWeight: null as number | null | undefined,
};

const basePet = {
  id: 'pet-1',
  name: 'Thor',
  organizationId: 'org-1',
  clientId: 'client-1',
};

const defaultProps = {
  apt: baseApt as any,
  pet: basePet as any,
  client: undefined,
  professional: undefined,
  isFinal: false,
  isDeliveryStage: false,
  isDeliveryAvailable: false,
  isNextStageAvailable: true,
  isInitialStage: false,
  notificationLogs: [],
  groomingStages: [],
  stageColor: 'violet',
  now: new Date('2026-05-15T10:30:00'),
  onOpen: noop,
  onNextStage: noopE,
  onDeliver: noopE,
  onWhatsApp: noopE,
  onEdit: noop,
  onView: noop,
  onDragStart: noopE,
};

describe('GroomingKanbanCard — checkinWeight', () => {
  it('exibe o peso no header quando checkinWeight está preenchido', () => {
    const props = {
      ...defaultProps,
      apt: { ...baseApt, checkinWeight: 4.5 } as any,
    };

    render(<GroomingKanbanCard {...props} />);

    expect(screen.getByText(/4\.5kg/)).toBeInTheDocument();
  });

  it('não exibe kg no header quando checkinWeight é null', () => {
    const props = {
      ...defaultProps,
      apt: { ...baseApt, checkinWeight: null } as any,
    };

    render(<GroomingKanbanCard {...props} />);

    expect(screen.queryByText(/kg/)).not.toBeInTheDocument();
  });
});
