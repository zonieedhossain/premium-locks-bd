package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"premium-locks-bd/models"
	"premium-locks-bd/services"
	"premium-locks-bd/utils"
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

// GET /api/admin/reports/top-products?from=&to=
func (h *ReportHandler) TopProducts(c *gin.Context) {
	data, err := h.svc.TopProducts(c.Query("from"), c.Query("to"))
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

// GET /api/admin/reports/profit?from=&to=&page=1&limit=10
func (h *ReportHandler) ProfitList(c *gin.Context) {
	data, err := h.svc.ProfitList(c.Query("from"), c.Query("to"))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	page, limit := utils.ParsePagination(c)
	paginatedData, total := utils.Paginate(data, page, limit)
	c.JSON(http.StatusOK, models.PaginatedResponse[services.ProfitRecord]{
		Data: paginatedData, Total: total, Page: page, Limit: limit,
	})
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

// GET /api/admin/reports/download/sales?from=&to=&format=csv
func (h *ReportHandler) DownloadSales(c *gin.Context) {
	from := c.Query("from")
	to := c.Query("to")
	format := c.DefaultQuery("format", "csv")

	var data []byte
	var err error
	var filename string
	var contentType string

	switch format {
	case "excel":
		data, err = h.svc.GenerateSalesExcel(from, to)
		contentType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
		filename = "sales_report.xlsx"
	case "pdf":
		data, err = h.svc.GenerateSalesPDF(from, to)
		contentType = "application/pdf"
		filename = "sales_report.pdf"
	default:
		data, err = h.svc.GenerateSalesCSV(from, to)
		contentType = "text/csv"
		filename = "sales_report.csv"
	}

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.Header("Content-Disposition", "attachment; filename="+filename)
	c.Data(http.StatusOK, contentType, data)
}

// GET /api/admin/reports/download/purchases?from=&to=&format=csv
func (h *ReportHandler) DownloadPurchases(c *gin.Context) {
	from := c.Query("from")
	to := c.Query("to")
	format := c.DefaultQuery("format", "csv")

	var data []byte
	var err error
	var filename string
	var contentType string

	switch format {
	case "excel":
		data, err = h.svc.GeneratePurchasesExcel(from, to)
		contentType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
		filename = "purchases_report.xlsx"
	case "pdf":
		data, err = h.svc.GeneratePurchasesPDF(from, to)
		contentType = "application/pdf"
		filename = "purchases_report.pdf"
	default:
		data, err = h.svc.GeneratePurchasesCSV(from, to)
		contentType = "text/csv"
		filename = "purchases_report.csv"
	}

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.Header("Content-Disposition", "attachment; filename="+filename)
	c.Data(http.StatusOK, contentType, data)
}

// GET /api/admin/reports/download/profit?from=&to=
func (h *ReportHandler) DownloadProfit(c *gin.Context) {
	from := c.Query("from")
	to := c.Query("to")

	data, err := h.svc.GenerateProfitPDF(from, to)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.Header("Content-Disposition", "attachment; filename=profit_report.pdf")
	c.Data(http.StatusOK, "application/pdf", data)
}

// GET /api/admin/reports/download/stock?format=excel
func (h *ReportHandler) DownloadStock(c *gin.Context) {
	format := c.DefaultQuery("format", "excel")
	var data []byte
	var err error
	var filename string
	var contentType string

	if format == "pdf" {
		data, err = h.svc.GenerateStockPDF()
		contentType = "application/pdf"
		filename = "stock_report.pdf"
	} else {
		data, err = h.svc.GenerateStockExcel()
		contentType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
		filename = "stock_report.xlsx"
	}

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.Header("Content-Disposition", "attachment; filename="+filename)
	c.Data(http.StatusOK, contentType, data)
}

// GET /api/admin/reports/download/top-products?from=&to=&format=excel
func (h *ReportHandler) DownloadTopProducts(c *gin.Context) {
	from := c.Query("from")
	to := c.Query("to")
	format := c.DefaultQuery("format", "excel")
	var data []byte
	var err error
	var filename string
	var contentType string

	if format == "pdf" {
		data, err = h.svc.GenerateTopProductsPDF(from, to)
		contentType = "application/pdf"
		filename = "top_products.pdf"
	} else {
		data, err = h.svc.GenerateTopProductsExcel(from, to)
		contentType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
		filename = "top_products.xlsx"
	}

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.Header("Content-Disposition", "attachment; filename="+filename)
	c.Data(http.StatusOK, contentType, data)
}
