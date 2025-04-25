DROP TABLE IF EXISTS public.knowledge_nodes CASCADE;
DROP TABLE IF EXISTS public.quiz_results CASCADE;

CREATE TABLE public.knowledge_nodes (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    parent_id BIGINT,
    content TEXT,
    examples TEXT,
    reference_links TEXT,
    level INTEGER NOT NULL,
    node_order INTEGER,
    CONSTRAINT fk_parent FOREIGN KEY (parent_id) REFERENCES public.knowledge_nodes(id)
);

CREATE TABLE public.quiz_results (
    id BIGSERIAL PRIMARY KEY,
    topic VARCHAR(255) NOT NULL,
    score DOUBLE PRECISION NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
); 