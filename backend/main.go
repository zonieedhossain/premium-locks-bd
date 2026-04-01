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
	"premium-locks-bd/storage"
)

func main() {
	cfg := config.Load()

	// Ensure directories exist
	mustMkdir(cfg.UploadDir)
	mustMkdir(cfg.StorageDir)
	mustMkdir(cfg.InvoiceDir)

	// Shared stores
	counterStore := storage.NewCounterStore(cfg.StorageDir + "/counters.json")

	// Repositories
	productRepo := repository.NewProductRepository(cfg.StorageDir)
	userRepo := repository.NewUserRepository(cfg.StorageDir)
	purchaseRepo := repository.NewPurchaseRepository(cfg.StorageDir)
	saleRepo := repository.NewSaleRepository(cfg.StorageDir)
	invoiceRepo := repository.NewInvoiceRepository(cfg.StorageDir)

	// Services
	authSvc := services.NewAuthService(userRepo, cfg.JWTSecret, cfg.AccessTokenTTL, cfg.RefreshTokenTTL)
	productSvc := services.NewProductService(productRepo, cfg.UploadDir)
	userSvc := services.NewUserService(userRepo)
	purchaseSvc := services.NewPurchaseService(purchaseRepo, productRepo)
	saleSvc := services.NewSaleService(saleRepo, productRepo, counterStore, cfg.TaxPercentage)
	emailSvc := services.NewEmailService(cfg.SMTPHost, cfg.SMTPPort, cfg.SMTPUser, cfg.SMTPPass, cfg.SMTPFrom, cfg.ContactEmail)
	invoiceSvc := services.NewInvoiceService(invoiceRepo, saleRepo, purchaseRepo, counterStore, services.InvoiceConfig{
		CompanyName:    cfg.CompanyName,
		CompanyAddress: cfg.CompanyAddress,
		CompanyPhone:   cfg.CompanyPhone,
		CompanyEmail:   cfg.CompanyEmail,
		TaxPercentage:  cfg.TaxPercentage,
		InvoiceDir:     cfg.InvoiceDir,
	})
	reportSvc := services.NewReportService(productRepo, saleRepo, purchaseRepo)

	// Seed default superadmin on first run
	if err := userSvc.SeedSuperAdmin(); err != nil {
		slog.Error("failed to seed superadmin", "err", err)
	} else {
		slog.Warn("default superadmin seeded — change password immediately", "email", "admin@admin.com")
	}

	// Handlers
	authHandler := handlers.NewAuthHandler(authSvc, userSvc)
	publicHandler := handlers.NewPublicHandler(productSvc, emailSvc)
	productHandler := handlers.NewAdminProductHandler(productSvc, cfg.UploadDir)
	userHandler := handlers.NewUserHandler(userSvc)
	purchaseHandler := handlers.NewPurchaseHandler(purchaseSvc)
	saleHandler := handlers.NewSaleHandler(saleSvc)
	invoiceHandler := handlers.NewInvoiceHandler(invoiceSvc)
	reportHandler := handlers.NewReportHandler(reportSvc)

	// Router
	r := gin.Default()
	r.Use(middleware.CORS(cfg.StorefrontURL, cfg.AdminURL))

	// Static files
	r.Static("/uploads", cfg.UploadDir)
	r.Static("/invoices", cfg.InvoiceDir)

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
		pub.POST("/contact", publicHandler.Contact)
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

	// Admin — purchase routes
	adminPurchases := r.Group("/api/admin/purchases", middleware.Auth(authSvc))
	{
		adminPurchases.GET("", middleware.RequirePermission("products:read"), purchaseHandler.GetAll)
		adminPurchases.GET("/:id", middleware.RequirePermission("products:read"), purchaseHandler.GetByID)
		adminPurchases.POST("", middleware.RequirePermission("products:write"), purchaseHandler.Create)
		adminPurchases.PUT("/:id", middleware.RequirePermission("products:write"), purchaseHandler.Update)
		adminPurchases.PATCH("/:id/receive", middleware.RequirePermission("products:write"), purchaseHandler.Receive)
		adminPurchases.PATCH("/:id/cancel", middleware.RequirePermission("products:write"), purchaseHandler.Cancel)
		adminPurchases.DELETE("/:id", middleware.RequirePermission("products:write"), purchaseHandler.Delete)
	}

	// Admin — sale routes
	adminSales := r.Group("/api/admin/sales", middleware.Auth(authSvc))
	{
		adminSales.GET("", middleware.RequirePermission("products:read"), saleHandler.GetAll)
		adminSales.GET("/:id", middleware.RequirePermission("products:read"), saleHandler.GetByID)
		adminSales.POST("", middleware.RequirePermission("products:write"), saleHandler.Create)
		adminSales.PUT("/:id", middleware.RequirePermission("products:write"), saleHandler.Update)
		adminSales.PATCH("/:id/cancel", middleware.RequirePermission("products:write"), saleHandler.Cancel)
		adminSales.PATCH("/:id/complete", middleware.RequirePermission("products:write"), saleHandler.Complete)
		adminSales.DELETE("/:id", middleware.RequirePermission("products:write"), saleHandler.Delete)
	}

	// Admin — invoice routes
	adminInvoices := r.Group("/api/admin/invoices", middleware.Auth(authSvc))
	{
		adminInvoices.GET("", middleware.RequirePermission("products:read"), invoiceHandler.GetAll)
		adminInvoices.POST("/sale/:saleId", middleware.RequirePermission("products:write"), invoiceHandler.GenerateForSale)
		adminInvoices.POST("/purchase/:purchaseId", middleware.RequirePermission("products:write"), invoiceHandler.GenerateForPurchase)
		adminInvoices.GET("/:id/download", middleware.RequirePermission("products:read"), invoiceHandler.Download)
		adminInvoices.GET("/:id/print", middleware.RequirePermission("products:read"), invoiceHandler.Print)
	}

	// Admin — report routes
	adminReports := r.Group("/api/admin/reports", middleware.Auth(authSvc))
	{
		adminReports.GET("/summary", middleware.RequirePermission("products:read"), reportHandler.Summary)
		adminReports.GET("/sales", middleware.RequirePermission("products:read"), reportHandler.Sales)
		adminReports.GET("/purchases", middleware.RequirePermission("products:read"), reportHandler.Purchases)
		adminReports.GET("/stock", middleware.RequirePermission("products:read"), reportHandler.Stock)
		adminReports.GET("/top-products", middleware.RequirePermission("products:read"), reportHandler.TopProducts)
		adminReports.GET("/monthly-comparison", middleware.RequirePermission("products:read"), reportHandler.MonthlyComparison)
		adminReports.GET("/payment-methods", middleware.RequirePermission("products:read"), reportHandler.PaymentMethods)
		adminReports.GET("/profit", middleware.RequirePermission("products:read"), reportHandler.ProfitList)
		adminReports.GET("/export/stock", middleware.RequirePermission("products:read"), reportHandler.ExportStock)
		adminReports.GET("/download/sales", middleware.RequirePermission("products:read"), reportHandler.DownloadSales)
		adminReports.GET("/download/purchases", middleware.RequirePermission("products:read"), reportHandler.DownloadPurchases)
		adminReports.GET("/download/profit", middleware.RequirePermission("products:read"), reportHandler.DownloadProfit)
		adminReports.GET("/download/stock", middleware.RequirePermission("products:read"), reportHandler.DownloadStock)
		adminReports.GET("/download/top-products", middleware.RequirePermission("products:read"), reportHandler.DownloadTopProducts)
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
