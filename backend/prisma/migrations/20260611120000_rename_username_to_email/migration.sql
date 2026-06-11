-- Rename username column to email for email-based authentication
ALTER TABLE `User` RENAME COLUMN `username` TO `email`;

-- Rename unique index
ALTER TABLE `User` RENAME INDEX `User_username_key` TO `User_email_key`;
