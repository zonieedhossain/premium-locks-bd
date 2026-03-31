package handlers

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"premium-locks-bd/services"
)

type PurchaseHandler struct {
	svc *services.PurchaseService
}

func NewPurchaseHandler(svc *services.PurchaseService) *PurchaseHandler {
	return &PurchaseHandler{svc: svc}
}

// GET /api/admin/purchases
func (h *PurchaseHandler) GetAll(c *gin.Context) {
	items, err := h.svc.GetAll()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, items)
}

// GET /api/admin/purchases/:id
func (h *PurchaseHandler) GetByID(c *gin.Context) {
	p, err := h.svc.GetByID(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, p)
}

type purchaseItemBody struct {
	ProductID string  `json:"product_id" binding:"required"`
	Quantity  int     `json:"quantity" binding:"required,min=1"`
	UnitCost  float64 `json:"unit_cost" binding:"required,min=0"`
}

type purchaseBody struct {
	SupplierName string             `json:"supplier_name" binding:"required"`
	Items        []purchaseItemBody `json:"items" binding:"required,min=1"`
	PaidAmount   float64            `json:"paid_amount"`
	Note         string             `json:"note"`
}

// POST /api/admin/purchases
func (h *PurchaseHandler) Create(c *gin.Context) {
	var body purchaseBody
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	claims := getClaimsFromCtx(c)
	input := services.PurchaseInput{
		SupplierName: body.SupplierName,
		PaidAmount:   body.PaidAmount,
		Note:         body.Note,
		CreatedBy:    claims.UserID,
	}
	for _, it := range body.Items {
		input.Items = append(input.Items, services.PurchaseItemInput{
			ProductID: it.ProductID,
			Quantity:  it.Quantity,
			UnitCost:  it.UnitCost,
		})
	}

	p, err := h.svc.Create(input)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, p)
}

// PUT /api/admin/purchases/:id
func (h *PurchaseHandler) Update(c *gin.Context) {
	var body purchaseBody
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	claims := getClaimsFromCtx(c)
	input := services.PurchaseInput{
		SupplierName: body.SupplierName,
		PaidAmount:   body.PaidAmount,
		Note:         body.Note,
		CreatedBy:    claims.UserID,
	}
	for _, it := range body.Items {
		input.Items = append(input.Items, services.PurchaseItemInput{
			ProductID: it.ProductID,
			Quantity:  it.Quantity,
			UnitCost:  it.UnitCost,
		})
	}

	p, err := h.svc.Update(c.Param("id"), input)
	if err != nil {
		status := http.StatusBadRequest
		if strings.Contains(err.Error(), "not found") {
			status = http.StatusNotFound
		}
		c.JSON(status, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, p)
}

// PATCH /api/admin/purchases/:id/receive
func (h *PurchaseHandler) Receive(c *gin.Context) {
	p, err := h.svc.Receive(c.Param("id"))
	if err != nil {
		status := http.StatusBadRequest
		if strings.Contains(err.Error(), "not found") {
			status = http.StatusNotFound
		}
		c.JSON(status, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, p)
}

// PATCH /api/admin/purchases/:id/cancel
func (h *PurchaseHandler) Cancel(c *gin.Context) {
	p, err := h.svc.Cancel(c.Param("id"))
	if err != nil {
		status := http.StatusBadRequest
		if strings.Contains(err.Error(), "not found") {
			status = http.StatusNotFound
		}
		c.JSON(status, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, p)
}

// DELETE /api/admin/purchases/:id
func (h *PurchaseHandler) Delete(c *gin.Context) {
	if err := h.svc.Delete(c.Param("id")); err != nil {
		status := http.StatusBadRequest
		if strings.Contains(err.Error(), "not found") {
			status = http.StatusNotFound
		}
		c.JSON(status, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "purchase deleted"})
}
