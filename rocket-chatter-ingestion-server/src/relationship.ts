interface Relationship {
	to: string
	type: string
}

// Data structure to store relationships
const relationships: Record<string, Relationship[]> = {}

// Helper function to add a relationship
function addRelationship(from: string, to: string, type: string): void {
	if (!relationships[from]) {
		relationships[from] = []
	}
	relationships[from].push({ to, type })
}
