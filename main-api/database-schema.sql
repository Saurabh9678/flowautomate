-- Database Schema for FlowAutomate
-- This schema matches the Sequelize models exactly

-- Create enum for PDF status
CREATE TYPE enum_pdfs_status AS ENUM ('queued', 'parsing', 'transform', 'ready', 'failed');

-- Create users table
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Create pdfs table
CREATE TABLE pdfs (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE NO ACTION ON UPDATE CASCADE,
    pdf_path TEXT NOT NULL,
    status enum_pdfs_status DEFAULT 'queued',
    error TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for better performance
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_deleted_at ON users(deleted_at);
CREATE INDEX idx_pdfs_user_id ON pdfs(user_id);
CREATE INDEX idx_pdfs_status ON pdfs(status);
CREATE INDEX idx_pdfs_deleted_at ON pdfs(deleted_at);

-- Add comments for documentation
COMMENT ON TABLE users IS 'User accounts for the FlowAutomate application';
COMMENT ON TABLE pdfs IS 'PDF documents associated with users';
COMMENT ON COLUMN users.deleted_at IS 'Soft delete timestamp - null means not deleted';
COMMENT ON COLUMN pdfs.deleted_at IS 'Soft delete timestamp - null means not deleted';
COMMENT ON COLUMN pdfs.status IS 'Current processing status of the PDF';
