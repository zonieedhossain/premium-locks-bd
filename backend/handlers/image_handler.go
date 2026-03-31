package handlers

// Image serving is handled directly by Gin's r.Static("/uploads", "./uploads") in main.go.
// This file is reserved for future image-specific operations such as:
//   - Image resize/optimisation endpoints
//   - Presigned URL generation
//   - Bulk image management
