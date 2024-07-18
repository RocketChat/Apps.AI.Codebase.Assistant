DROP INDEX `nameEmbeddings`;
DROP INDEX `codeEmbeddings`;

CREATE VECTOR INDEX `nameEmbeddings`
FOR (n: Node) ON (n.nameEmbeddings)
OPTIONS {indexConfig: {
   `vector.dimensions`: 768,
   `vector.similarity_function`: 'COSINE'
}};

CREATE VECTOR INDEX `codeEmbeddings`
FOR (n: Node) ON (n.codeEmbeddings)
OPTIONS {indexConfig: {
   `vector.dimensions`: 768,
   `vector.similarity_function`: 'COSINE'
}};
