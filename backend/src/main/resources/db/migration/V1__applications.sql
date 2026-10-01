CREATE TABLE applications (
    id UUID PRIMARY KEY,
    company VARCHAR(200) NOT NULL,
    role VARCHAR(200) NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('Interested', 'Applied', 'Interview', 'Offer', 'Rejected')),
    link VARCHAR(2048),
    next_follow_up TIMESTAMP WITH TIME ZONE,
    notes VARCHAR(20000),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL
);
CREATE INDEX applications_created_at_idx ON applications (created_at DESC);
