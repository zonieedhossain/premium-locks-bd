package handlers

import (
	"net/http"
	"path/filepath"

	"github.com/gin-gonic/gin"
	"premium-locks-bd/models"
	"premium-locks-bd/services"
	"premium-locks-bd/utils"
)

type InvoiceHandler struct {
	svc *services.InvoiceService
}

func NewInvoiceHandler(svc *services.InvoiceService) *InvoiceHandler {
	return &InvoiceHandler{svc: svc}
}

// GET /api/admin/invoices
func (h *InvoiceHandler) GetAll(c *gin.Context) {
	items, err := h.svc.GetAll()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	page, limit := utils.ParsePagination(c)
	data, total := utils.Paginate(items, page, limit)
	c.JSON(http.StatusOK, models.PaginatedResponse[models.Invoice]{
		Data: data, Total: total, Page: page, Limit: limit,
	})
}

// POST /api/admin/invoices/sale/:saleId
func (h *InvoiceHandler) GenerateForSale(c *gin.Context) {
	inv, err := h.svc.GenerateForSale(c.Param("saleId"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, inv)
}

// POST /api/admin/invoices/purchase/:purchaseId
func (h *InvoiceHandler) GenerateForPurchase(c *gin.Context) {
	inv, err := h.svc.GenerateForPurchase(c.Param("purchaseId"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, inv)
}

// GET /api/admin/invoices/:id/download
func (h *InvoiceHandler) Download(c *gin.Context) {
	inv, err := h.svc.GetByID(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}
	c.Header("Content-Disposition", "attachment; filename="+filepath.Base(inv.FilePath))
	c.File(inv.FilePath)
}

// GET /api/admin/invoices/:id/print
func (h *InvoiceHandler) Print(c *gin.Context) {
	inv, err := h.svc.GetByID(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}
	c.Header("Content-Disposition", "inline; filename="+filepath.Base(inv.FilePath))
	c.File(inv.FilePath)
}
