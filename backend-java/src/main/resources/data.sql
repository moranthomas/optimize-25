-- Insert root nodes
INSERT INTO public.knowledge_nodes (name, description, level, node_order)
VALUES ('Core Learning Modules', 'Fundamental learning modules for personal development', 0, 1);

INSERT INTO public.knowledge_nodes (name, description, level, node_order)
VALUES ('Optimize Physical', 'Physical health and fitness optimization', 0, 2);

INSERT INTO public.knowledge_nodes (name, description, level, node_order)
VALUES ('Optimize Mental', 'Mental health and cognitive optimization', 0, 3);

INSERT INTO public.knowledge_nodes (name, description, level, node_order)
VALUES ('Optimize Emotional', 'Emotional intelligence and well-being', 0, 4);

INSERT INTO public.knowledge_nodes (name, description, level, node_order)
VALUES ('Optimize Productivity', 'Productivity and time management', 0, 5);

INSERT INTO public.knowledge_nodes (name, description, level, node_order)
VALUES ('Career', 'Career development and professional growth', 0, 6);

INSERT INTO public.knowledge_nodes (name, description, level, node_order)
VALUES ('School', 'Academic and educational topics', 0, 7);

-- Insert Software Engineering under School
INSERT INTO public.knowledge_nodes (name, description, parent_id, level, node_order)
SELECT 'Software Engineering', 'Software development and engineering principles', id, 1, 1
FROM public.knowledge_nodes WHERE name = 'School';

-- Insert main branches under Software Engineering
INSERT INTO public.knowledge_nodes (name, description, parent_id, level, node_order)
SELECT 'Networking', 'Main branch: Networking', id, 2, 1
FROM public.knowledge_nodes WHERE name = 'Software Engineering';

INSERT INTO public.knowledge_nodes (name, description, parent_id, level, node_order)
SELECT 'Security', 'Main branch: Security', id, 2, 2
FROM public.knowledge_nodes WHERE name = 'Software Engineering';

INSERT INTO public.knowledge_nodes (name, description, parent_id, level, node_order)
SELECT 'Algorithms', 'Main branch: Algorithms', id, 2, 3
FROM public.knowledge_nodes WHERE name = 'Software Engineering';

INSERT INTO public.knowledge_nodes (name, description, parent_id, level, node_order)
SELECT 'Software Architecture', 'Main branch: Software Architecture', id, 2, 4
FROM public.knowledge_nodes WHERE name = 'Software Engineering';

-- Insert Networking subtopics
INSERT INTO public.knowledge_nodes (name, description, parent_id, level, node_order)
SELECT 'Network Protocols (TCP/IP, HTTP, WebSocket)', 
       'Overview of fundamental network protocols including TCP/IP, HTTP, and WebSocket',
       id, 3, 1
FROM public.knowledge_nodes WHERE name = 'Networking';

INSERT INTO public.knowledge_nodes (name, description, parent_id, level, node_order)
SELECT 'Network Security (SSL/TLS, Firewalls)',
       'Understanding network security protocols and tools',
       id, 3, 2
FROM public.knowledge_nodes WHERE name = 'Networking';

-- Insert Security subtopics
INSERT INTO public.knowledge_nodes (name, description, parent_id, level, node_order)
SELECT 'Authentication and Authorization',
       'Understanding user identity verification and access control',
       id, 3, 1
FROM public.knowledge_nodes WHERE name = 'Security';

INSERT INTO public.knowledge_nodes (name, description, parent_id, level, node_order)
SELECT 'Cryptography Fundamentals',
       'Basic principles of encryption and cryptographic systems',
       id, 3, 2
FROM public.knowledge_nodes WHERE name = 'Security';

-- Insert Algorithm subtopics
INSERT INTO public.knowledge_nodes (name, description, parent_id, level, node_order)
SELECT 'Data Structures and Complexity Analysis',
       'Understanding fundamental data structures and algorithmic complexity',
       id, 3, 1
FROM public.knowledge_nodes WHERE name = 'Algorithms';

INSERT INTO public.knowledge_nodes (name, description, parent_id, level, node_order)
SELECT 'Search and Sort Algorithms',
       'Common searching and sorting algorithms and their implementations',
       id, 3, 2
FROM public.knowledge_nodes WHERE name = 'Algorithms';

-- Insert Architecture subtopics
INSERT INTO public.knowledge_nodes (name, description, parent_id, level, node_order)
SELECT 'Design Patterns',
       'Common software design patterns and their applications',
       id, 3, 1
FROM public.knowledge_nodes WHERE name = 'Software Architecture';

INSERT INTO public.knowledge_nodes (name, description, parent_id, level, node_order)
SELECT 'Microservices Architecture',
       'Understanding microservices architecture principles and patterns',
       id, 3, 2
FROM public.knowledge_nodes WHERE name = 'Software Architecture'; 