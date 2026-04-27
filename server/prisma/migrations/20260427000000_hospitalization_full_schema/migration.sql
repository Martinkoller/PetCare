-- AlterTable hospitalization_stays: add new admission and discharge fields
ALTER TABLE `hospitalization_stays`
  ADD COLUMN `origin` VARCHAR(191) NULL,
  ADD COLUMN `attending_vet_name` VARCHAR(191) NULL,
  ADD COLUMN `weight_at_admission` DOUBLE NULL,
  ADD COLUMN `triage_level` VARCHAR(191) NULL,
  ADD COLUMN `presumptive_diagnosis` TEXT NULL,
  ADD COLUMN `initial_notes` TEXT NULL,
  ADD COLUMN `admitted_at` DATETIME(3) NOT NULL DEFAULT NOW(3),
  ADD COLUMN `discharge_at` DATETIME(3) NULL,
  ADD COLUMN `bed_released_at` DATETIME(3) NULL,
  ADD COLUMN `discharge_type` VARCHAR(191) NULL,
  ADD COLUMN `discharge_condition` VARCHAR(191) NULL,
  ADD COLUMN `final_diagnosis` TEXT NULL,
  ADD COLUMN `discharge_summary` TEXT NULL,
  ADD COLUMN `discharge_instructions` TEXT NULL,
  ADD COLUMN `discharge_medications` TEXT NULL,
  ADD COLUMN `return_recommendation` VARCHAR(191) NULL,
  ADD COLUMN `administrative_notes` TEXT NULL;

-- AlterTable hospitalization_logs: add full vitals and clinical fields
ALTER TABLE `hospitalization_logs`
  ADD COLUMN `event_at` DATETIME(3) NULL,
  ADD COLUMN `respiratory_rate` INT NULL,
  ADD COLUMN `pain_score` INT NULL,
  ADD COLUMN `capillary_refill_time` VARCHAR(191) NULL,
  ADD COLUMN `mucous_membranes` VARCHAR(191) NULL,
  ADD COLUMN `hydration_level` VARCHAR(191) NULL,
  ADD COLUMN `consciousness` VARCHAR(191) NULL,
  ADD COLUMN `clinical_checks` TEXT NULL,
  ADD COLUMN `conduct` TEXT NULL,
  ADD COLUMN `status_after` VARCHAR(191) NULL;

-- Update default type value for new logs
ALTER TABLE `hospitalization_logs`
  MODIFY COLUMN `type` VARCHAR(191) NOT NULL DEFAULT 'medical_evolution';
