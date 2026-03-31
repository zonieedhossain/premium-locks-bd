package handlers

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"premium-locks-bd/services"
)

type SaleHandler struct {
	svc *services.SaleService
}

func NewSaleHandler(svc *services.SaleService) *SaleHandler {
	return &SaleHandler{svc: svc}
}

// GET /api/admin/sales
func (h *SaleHandler) GetAll(c *gin.Context) {
	items, err := h.svc.GetAll()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, items)
}

// GET /api/admin/sales/:id
func (h *SaleHandler) GetByID(c *gin.Context) {
	s, err := h.svc.GetByID(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, s)
}

type saleItemBody struct {
	ProductID string  `json:"product_id" binding:"required"`
	Quantity  int     `json:"quantity" binding:"required,min=1"`
	UnitPrice float64 `json:"unit_price" binding:"required,min=0"`
	Discount  float64 `json:"discount"`
}

type saleBody struct {
	CustomerName    string         `json:"customer_name" binding:"required"`
	CustomerEmail   string         `json:"customer_email"`
	CustomerPhone   string         `json:"customer_phone"`
	CustomerAddress string         `json:"customer_address"`
	Items           []saleItemBody `json:"items" binding:"required,min=1"`
	DiscountAmount  float64        `json:"discount_amount"`
	PaidAmount      float64        `json:"paid_amount"`
	PaymentMethod   string         `json:"payment_method"`
	Note            string         `json:"note"`
}

// POST /api/admin/sales
func (h *SaleHandler) Create(c *gin.Context) {
	var body saleBody
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	claims := getClaimsFromCtx(c)
	input := services.SaleInput{
		CustomerName:    body.CustomerName,
		CustomerEmail:   body.CustomerEmail,
		CustomerPhone:   body.CustomerPhone,
		CustomerAddress: body.CustomerAddress,
		DiscountAmount:  body.DiscountAmount,
		PaidAmount:      body.PaidAmount,
		PaymentMethod:   body.PaymentMethod,
		Note:            body.Note,
		CreatedBy:       claims.UserID,
	}
	for _, it := range body.Items {
		input.Items = append(input.Items, services.SaleItemInput{
			ProductID: it.ProductID,
			Quantity:  it.Quantity,
			UnitPrice: it.UnitPrice,
			Discount:  it.Discount,
		})
	}

	s, err := h.svc.Create(input)
	if err != nil {
		status := http.StatusBadRequest
		if strings.Contains(err.Error(), "insufficient stock") {
			status = http.StatusBadRequest
		}
		c.JSON(status, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, s)
}

// PUT /api/admin/sales/:id
func (h *SaleHandler) Update(c *gin.Context) {
	var body saleBody
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	claims := getClaimsFromCtx(c)
	input := services.SaleInput{
		CustomerName:    body.CustomerName,
		CustomerEmail:   body.CustomerEmail,
		CustomerPhone:   body.CustomerPhone,
		CustomerAddress: body.CustomerAddress,
		DiscountAmount:  body.DiscountAmount,
		PaidAmount:      body.PaidAmount,
		PaymentMethod:   body.PaymentMethod,
		Note:            body.Note,
		CreatedBy:       claims.UserID,
	}

	s, err := h.svc.Update(c.Param("id"), input)
	if err != nil {
		status := http.StatusBadRequest
		if strings.Contains(err.Error(), "not found") {
			status = http.StatusNotFound
		}
		c.JSON(status, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, s)
}

// PATCH /api/admin/sales/:id/cancel
func (h *SaleHandler) Cancel(c *gin.Context) {
	s, err := h.svc.Cancel(c.Param("id"))
	if err != nil {
		status := http.StatusBadRequest
		if strings.Contains(err.Error(), "not found") {
			status = http.StatusNotFound
		}
		c.JSON(status, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, s)
}

// DELETE /api/admin/sales/:id
func (h *SaleHandler) Delete(c *gin.Context) {
	if err := h.svc.Delete(c.Param("id")); err != nil {
		status := http.StatusBadRequest
		if strings.Contains(err.Error(), "not found") {
			status = http.StatusNotFound
		}
		c.JSON(status, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "sale deleted"})
}
