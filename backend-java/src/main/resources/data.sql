-- Insert root node
INSERT INTO public.knowledge_nodes (name, description, level, node_order)
VALUES ('Software Engineering', 'Root node for the knowledge tree', 0, 0);

-- Insert main branches
INSERT INTO public.knowledge_nodes (name, description, parent_id, level, node_order)
SELECT 'Networking', 'Main branch: Networking', id, 1, 1
FROM public.knowledge_nodes WHERE name = 'Software Engineering';

INSERT INTO public.knowledge_nodes (name, description, parent_id, level, node_order)
SELECT 'Security', 'Main branch: Security', id, 1, 2
FROM public.knowledge_nodes WHERE name = 'Software Engineering';

INSERT INTO public.knowledge_nodes (name, description, parent_id, level, node_order)
SELECT 'Algorithms', 'Main branch: Algorithms', id, 1, 3
FROM public.knowledge_nodes WHERE name = 'Software Engineering';

INSERT INTO public.knowledge_nodes (name, description, parent_id, level, node_order)
SELECT 'Software Architecture', 'Main branch: Software Architecture', id, 1, 4
FROM public.knowledge_nodes WHERE name = 'Software Engineering';

-- Insert Networking subtopics
INSERT INTO public.knowledge_nodes (name, description, parent_id, level, node_order)
SELECT 'Network Protocols (TCP/IP, HTTP, WebSocket)', 
       'Overview of fundamental network protocols including TCP/IP, HTTP, and WebSocket',
       id, 2, 1
FROM public.knowledge_nodes WHERE name = 'Networking';

INSERT INTO public.knowledge_nodes (name, description, parent_id, level, node_order)
SELECT 'Network Security (SSL/TLS, Firewalls)',
       'Understanding network security protocols and tools',
       id, 2, 2
FROM public.knowledge_nodes WHERE name = 'Networking';

-- Insert Security subtopics
INSERT INTO public.knowledge_nodes (name, description, parent_id, level, node_order)
SELECT 'Authentication and Authorization',
       'Understanding user identity verification and access control',
       id, 2, 1
FROM public.knowledge_nodes WHERE name = 'Security';

INSERT INTO public.knowledge_nodes (name, description, parent_id, level, node_order)
SELECT 'Cryptography Fundamentals',
       'Basic principles of encryption and cryptographic systems',
       id, 2, 2
FROM public.knowledge_nodes WHERE name = 'Security';

-- Insert Algorithm subtopics
INSERT INTO public.knowledge_nodes (name, description, parent_id, level, node_order)
SELECT 'Data Structures and Complexity Analysis',
       'Understanding fundamental data structures and algorithmic complexity',
       id, 2, 1
FROM public.knowledge_nodes WHERE name = 'Algorithms';

INSERT INTO public.knowledge_nodes (name, description, parent_id, level, node_order)
SELECT 'Search and Sort Algorithms',
       'Common searching and sorting algorithms and their implementations',
       id, 2, 2
FROM public.knowledge_nodes WHERE name = 'Algorithms';

-- Insert Architecture subtopics
INSERT INTO public.knowledge_nodes (name, description, parent_id, level, node_order)
SELECT 'Design Patterns',
       'Common software design patterns and their applications',
       id, 2, 1
FROM public.knowledge_nodes WHERE name = 'Software Architecture';

INSERT INTO public.knowledge_nodes (name, description, parent_id, level, node_order)
SELECT 'Microservices Architecture',
       'Understanding microservices architecture principles and patterns',
       id, 2, 2
FROM public.knowledge_nodes WHERE name = 'Software Architecture'; 