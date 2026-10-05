CREATE TABLE IF NOT EXISTS accordion_items (
  id SERIAL PRIMARY KEY,
  label VARCHAR(100) NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO accordion_items (label, content)
VALUES
  ('HTML', 'The HyperText Markup Language or HTML is the standard markup language for documents designed to be displayed in a web browser.'),
  ('CSS', 'Cascading Style Sheets is a style sheet language used for describing the presentation of a document written in a markup language such as HTML or XML.'),
  ('JAVASCRIPT', 'JavaScript, often abbreviated as JS, is a programming language that is one of the core technologies of the World Wide Web, alongside HTML and CSS.')
ON CONFLICT DO NOTHING;
