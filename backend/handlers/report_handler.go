package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"premium-locks-bd/services"
)

type ReportHandler struct {
	svc *services.ReportService
}

func NewReportHandler(svc *services.ReportService) *ReportHandler {
	return &ReportHandler{svc: svc}
}

// GET /api/admin/reports/summary
func (h *ReportHandler) Summary(c *gin.Context) {
	s, err := h.svc.Summary()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, s)
}

// GET /api/admin/reports/sales?from=&to=
func (h *ReportHandler) Sales(c *gin.Context) {
	data, err := h.svc.SalesByDateRange(c.Query("from"), c.Query("to"))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, data)
}

// GET /api/admin/reports/purchases?from=&to=
func (h *ReportHandler) Purchases(c *gin.Context) {
	data, err := h.svc.PurchasesByDateRange(c.Query("from"), c.Query("to"))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, data)
}

// GET /api/admin/reports/stock
func (h *ReportHandler) Stock(c *gin.Context) {
	data, err := h.svc.StockReport()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, data)
}

// GET /api/admin/reports/top-products
func (h *ReportHandler) TopProducts(c *gin.Context) {
	data, err := h.svc.TopProducts()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, data)
}

// GET /api/admin/reports/monthly-comparison
func (h *ReportHandler) MonthlyComparison(c *gin.Context) {
	data, err := h.svc.MonthlyComparison()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, data)
}

// GET /api/admin/reports/payment-methods
func (h *ReportHandler) PaymentMethods(c *gin.Context) {
	data, err := h.svc.PaymentMethods()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, data)
}

// GET /api/admin/reports/export/sales
func (h *ReportHandler) ExportSales(c *gin.Context) {
	data, err := h.svc.SalesReport(c.Query("from"), c.Query("to"))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, data)
}

// GET /api/admin/reports/export/stock
func (h *ReportHandler) ExportStock(c *gin.Context) {
	data, err := h.svc.StockReport()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, data)
}
