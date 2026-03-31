package main

import (
	"log/slog"
	"net/http"
	"os"

	"github.com/gin-gonic/gin"
	"premium-locks-bd/config"
	"premium-locks-bd/handlers"
	"premium-locks-bd/middleware"
	"premium-locks-bd/repository"
	"premium-locks-bd/services"
)

func main() {
	cfg := config.Load()

	// Ensure directories exist
	mustMkdir(cfg.UploadDir)
	mustMkdir(cfg.StorageDir)

	// Repositories
	productRepo := repository.NewProductRepository(cfg.StorageDir)
	userRepo := repository.NewUserRepository(cfg.StorageDir)

	// Services
	authSvc := services.NewAuthService(userRepo, cfg.JWTSecret, cfg.AccessTokenTTL, cfg.RefreshTokenTTL)
	productSvc := services.NewProductService(productRepo, cfg.UploadDir)
	userSvc := services.NewUserService(userRepo)

	// Seed default superadmin on first run
	if err := userSvc.SeedSuperAdmin(); err != nil {
		slog.Error("failed to seed superadmin", "err", err)
	} else {
		slog.Warn("default superadmin seeded — change password immediately", "email", "admin@admin.com")
	}

	// Handlers
	authHandler := handlers.NewAuthHandler(authSvc, userSvc)
	publicHandler := handlers.NewPublicHandler(productSvc)
	productHandler := handlers.NewAdminProductHandler(productSvc, cfg.UploadDir)
	userHandler := handlers.NewUserHandler(userSvc)

	// Router
	r := gin.Default()
	r.Use(middleware.CORS(cfg.StorefrontURL, cfg.AdminURL))

	// Static uploads
	r.Static("/uploads", cfg.UploadDir)

	// Health
	r.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok"})
	})

	// Public routes (storefront)
	pub := r.Group("/api/public")
	{
		pub.GET("/products", publicHandler.GetProducts)
		pub.GET("/products/category/:category", publicHandler.GetProductsByCategory)
		pub.GET("/products/:slug", publicHandler.GetProductBySlug)
	}

	// Auth routes
	auth := r.Group("/api/auth")
	{
		auth.POST("/login", authHandler.Login)
		auth.POST("/refresh", authHandler.Refresh)
		auth.POST("/logout", authHandler.Logout)
		auth.GET("/me", middleware.Auth(authSvc), authHandler.Me)
	}

	// Admin — product routes
	adminProducts := r.Group("/api/admin/products", middleware.Auth(authSvc))
	{
		adminProducts.GET("", middleware.RequirePermission("products:read"), productHandler.GetAll)
		adminProducts.GET("/:id", middleware.RequirePermission("products:read"), productHandler.GetByID)
		adminProducts.POST("", middleware.RequirePermission("products:write"), productHandler.Create)
		adminProducts.PUT("/:id", middleware.RequirePermission("products:write"), productHandler.Update)
		adminProducts.DELETE("/:id", middleware.RequirePermission("products:write"), productHandler.Delete)
	}

	// Admin — user routes
	adminUsers := r.Group("/api/admin/users", middleware.Auth(authSvc))
	{
		adminUsers.GET("", middleware.RequirePermission("users:read"), userHandler.GetAll)
		adminUsers.GET("/:id", middleware.RequirePermission("users:read"), userHandler.GetByID)
		adminUsers.POST("", middleware.RequirePermission("users:write"), userHandler.Create)
		adminUsers.PUT("/:id", middleware.RequirePermission("users:write"), userHandler.Update)
		adminUsers.PATCH("/:id/toggle", middleware.RequirePermission("users:write"), userHandler.ToggleActive)
		adminUsers.DELETE("/:id", middleware.RequirePermission("users:write"), userHandler.Delete)
	}

	slog.Info("backend starting", "port", cfg.Port)
	if err := r.Run(":" + cfg.Port); err != nil {
		slog.Error("server error", "err", err)
		os.Exit(1)
	}
}

func mustMkdir(path string) {
	if err := os.MkdirAll(path, 0o755); err != nil {
		slog.Error("failed to create directory", "path", path, "err", err)
		os.Exit(1)
	}
}
