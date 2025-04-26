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
VALUES ('Learning Plan', 'Academic and educational topics', 0, 6);

-- Insert Software Engineering under Learning Plan
INSERT INTO public.knowledge_nodes (name, description, parent_id, level, node_order)
SELECT 'Software Engineering', 'Software development and engineering principles', id, 1, 1
FROM public.knowledge_nodes WHERE name = 'Learning Plan';

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
SELECT 'Network Protocols', 'Network communication protocols', id, 3, 1
FROM public.knowledge_nodes WHERE name = 'Networking';

INSERT INTO public.knowledge_nodes (name, description, parent_id, level, node_order)
SELECT 'Network Security', 'Network security principles', id, 3, 2
FROM public.knowledge_nodes WHERE name = 'Networking';

INSERT INTO public.knowledge_nodes (name, description, parent_id, level, node_order)
SELECT 'Network Architecture', 'Network design and architecture', id, 3, 3
FROM public.knowledge_nodes WHERE name = 'Networking';

-- Insert Security subtopics
INSERT INTO public.knowledge_nodes (name, description, parent_id, level, node_order)
SELECT 'Cryptography', 'Cryptographic principles and algorithms', id, 3, 1
FROM public.knowledge_nodes WHERE name = 'Security';

INSERT INTO public.knowledge_nodes (name, description, parent_id, level, node_order)
SELECT 'Authentication', 'Authentication methods and systems', id, 3, 2
FROM public.knowledge_nodes WHERE name = 'Security';

INSERT INTO public.knowledge_nodes (name, description, parent_id, level, node_order)
SELECT 'Authorization', 'Authorization and access control', id, 3, 3
FROM public.knowledge_nodes WHERE name = 'Security';

-- Insert Algorithms subtopics
INSERT INTO public.knowledge_nodes (name, description, parent_id, level, node_order)
SELECT 'Sorting Algorithms', 'Various sorting algorithms', id, 3, 1
FROM public.knowledge_nodes WHERE name = 'Algorithms';

INSERT INTO public.knowledge_nodes (name, description, parent_id, level, node_order)
SELECT 'Search Algorithms', 'Search and retrieval algorithms', id, 3, 2
FROM public.knowledge_nodes WHERE name = 'Algorithms';

INSERT INTO public.knowledge_nodes (name, description, parent_id, level, node_order)
SELECT 'Graph Algorithms', 'Graph theory and algorithms', id, 3, 3
FROM public.knowledge_nodes WHERE name = 'Algorithms';

-- Insert Software Architecture subtopics
INSERT INTO public.knowledge_nodes (name, description, parent_id, level, node_order)
SELECT 'Design Patterns', 'Software design patterns', id, 3, 1
FROM public.knowledge_nodes WHERE name = 'Software Architecture';

INSERT INTO public.knowledge_nodes (name, description, parent_id, level, node_order)
SELECT 'System Design', 'System architecture and design', id, 3, 2
FROM public.knowledge_nodes WHERE name = 'Software Architecture';

INSERT INTO public.knowledge_nodes (name, description, parent_id, level, node_order)
SELECT 'Microservices', 'Microservices architecture', id, 3, 3
FROM public.knowledge_nodes WHERE name = 'Software Architecture';

-- Update Optimize Productivity with description
UPDATE public.knowledge_nodes 
SET description = 'Productivity and time management'
WHERE name = 'Optimize Productivity';

-- Insert Time Management under Optimize Productivity
INSERT INTO public.knowledge_nodes (name, description, content, parent_id, level, node_order)
SELECT 'Time Management',
       'Effective strategies to manage time to optimize productivity.',
       'Time management techniques such as prioritization, delegation, and setting goals can greatly increase productivity. The Pomodoro technique, for example, involves working intensively for a specified period of time, followed by a short break. Another strategy is to delegate tasks that others can do so that you can focus on tasks only you can do. Lastly, setting clear, achievable goals can help keep you focused and motivated.',
       id, 1, 2
FROM public.knowledge_nodes WHERE name = 'Optimize Productivity';

-- Insert Workplace Organization under Optimize Productivity
INSERT INTO public.knowledge_nodes (name, description, content, parent_id, level, node_order)
SELECT 'Workplace Organization',
       'How to organize your workspace for optimal productivity.',
       'A clutter-free and organized workspace can greatly improve productivity. This includes organizing your physical workspace, like your desk, but also your digital workspace. Regularly clean and organize your workspace to reduce distractions and make it easier to find what you need. Use tools like digital calendars, task management apps, and cloud storage to keep your digital workspace organized.',
       id, 1, 3
FROM public.knowledge_nodes WHERE name = 'Optimize Productivity';

-- Insert Healthy Lifestyle under Optimize Productivity
INSERT INTO public.knowledge_nodes (name, description, content, parent_id, level, node_order)
SELECT 'Healthy Lifestyle',
       'The impact of a healthy lifestyle on productivity.',
       'Good health is a key factor in productivity. This includes getting enough sleep, eating a balanced diet, exercising regularly, and taking breaks to rest and rejuvenate. Sleep deprivation, poor nutrition, and lack of exercise can all lead to decreased productivity. Regular breaks, including vacations, can also help prevent burnout and maintain high productivity levels.',
       id, 1, 4
FROM public.knowledge_nodes WHERE name = 'Optimize Productivity';

-- Insert Work-Life Balance under Optimize Productivity
INSERT INTO public.knowledge_nodes (name, description, content, parent_id, level, node_order)
SELECT 'Work-Life Balance',
       'The importance of balancing work and personal life to optimize productivity.',
       'Maintaining a healthy work-life balance is essential for long-term productivity. Overworking can lead to burnout, which can drastically reduce productivity. It''s important to set boundaries between work and personal life. This could involve setting specific work hours, making time for hobbies and relaxation, and ensuring you take time off when needed.',
       id, 1, 5
FROM public.knowledge_nodes WHERE name = 'Optimize Productivity';

-- Insert Mindset and Motivation under Optimize Productivity
INSERT INTO public.knowledge_nodes (name, description, content, parent_id, level, node_order)
SELECT 'Mindset and Motivation',
       'How mindset and motivation affect productivity.',
       'Maintaining a positive mindset and high level of motivation can greatly improve productivity. This involves setting achievable goals, celebrating successes, and maintaining a positive attitude. It''s also important to stay motivated, which can be achieved through various techniques such as self-rewarding, visualizing success, and maintaining a passion for what you do.',
       id, 1, 6
FROM public.knowledge_nodes WHERE name = 'Optimize Productivity'; 