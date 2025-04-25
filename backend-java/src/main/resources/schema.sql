DROP TABLE IF EXISTS public.knowledge_nodes CASCADE;

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