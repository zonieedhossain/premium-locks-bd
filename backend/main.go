package main

import (
	"log"
	"net/http"
	"os"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"premium-locks-bd/handlers"
	"premium-locks-bd/services"
	"premium-locks-bd/storage"
)

func main() {
	// Ensure uploads directory exists before starting
	if err := os.MkdirAll("./uploads", 0o755); err != nil {
		log.Fatalf("failed to create uploads directory: %v", err)
	}

	store, err := storage.NewExcelStore()
	if err != nil {
		log.Fatalf("failed to initialise storage: %v", err)
	}

	svc := services.NewProductService(store)
	productHandler := handlers.NewProductHandler(svc)

	r := gin.Default()

	// CORS — allow the Vite dev server
	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:5173", "http://localhost:4173"},
		AllowMethods:     []string{http.MethodGet, http.MethodPost, http.MethodPut, http.MethodDelete, http.MethodOptions},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
	}))

	// Static image serving
	r.Static("/uploads", "./uploads")

	// API routes
	api := r.Group("/api")
	{
		api.GET("/products", productHandler.GetAll)
		api.GET("/products/:id", productHandler.GetByID)
		api.POST("/products", productHandler.Create)
		api.PUT("/products/:id", productHandler.Update)
		api.DELETE("/products/:id", productHandler.Delete)
	}

	// Health check
	r.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok"})
	})

	log.Println("Backend API listening on http://localhost:8080")
	if err := r.Run(":8080"); err != nil {
		log.Fatalf("server error: %v", err)
	}
}
