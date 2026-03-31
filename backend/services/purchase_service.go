package services

import (
	"fmt"
	"log/slog"
	"sync"
	"time"

	"github.com/google/uuid"
	"premium-locks-bd/models"
	"premium-locks-bd/repository"
)

type PurchaseService struct {
	mu          sync.Mutex
	purchaseRepo repository.PurchaseRepository
	productRepo  repository.ProductRepository
}

func NewPurchaseService(purchaseRepo repository.PurchaseRepository, productRepo repository.ProductRepository) *PurchaseService {
	return &PurchaseService{purchaseRepo: purchaseRepo, productRepo: productRepo}
}

func (s *PurchaseService) GetAll() ([]models.Purchase, error) {
	return s.purchaseRepo.GetAll()
}

func (s *PurchaseService) GetByID(id string) (*models.Purchase, error) {
	return s.purchaseRepo.GetByID(id)
}

type PurchaseInput struct {
	SupplierName string
	Items        []PurchaseItemInput
	PaidAmount   float64
	Note         string
	CreatedBy    string
}

type PurchaseItemInput struct {
	ProductID string
	Quantity  int
	UnitCost  float64
}

func (s *PurchaseService) Create(input PurchaseInput) (*models.Purchase, error) {
	if input.SupplierName == "" {
		return nil, fmt.Errorf("supplier name is required")
	}
	if len(input.Items) == 0 {
		return nil, fmt.Errorf("at least one item is required")
	}

	// Resolve product names/SKUs
	var items []models.PurchaseItem
	var total float64
	for _, item := range input.Items {
		p, err := s.productRepo.GetByID(item.ProductID)
		if err != nil {
			return nil, fmt.Errorf("product not found: %s", item.ProductID)
		}
		subtotal := float64(item.Quantity) * item.UnitCost
		total += subtotal
		items = append(items, models.PurchaseItem{
			ProductID:   item.ProductID,
			ProductName: p.Name,
			SKU:         p.SKU,
			Quantity:    item.Quantity,
			UnitCost:    item.UnitCost,
			Subtotal:    subtotal,
		})
	}

	now := time.Now().UTC().Format(time.RFC3339)
	purchase := models.Purchase{
		ID:           uuid.NewString(),
		SupplierName: input.SupplierName,
		Items:        items,
		TotalAmount:  total,
		PaidAmount:   input.PaidAmount,
		Status:       "pending",
		Note:         input.Note,
		CreatedBy:    input.CreatedBy,
		CreatedAt:    now,
		UpdatedAt:    now,
	}

	if err := s.purchaseRepo.Save(purchase); err != nil {
		return nil, err
	}
	return &purchase, nil
}

func (s *PurchaseService) Update(id string, input PurchaseInput) (*models.Purchase, error) {
	existing, err := s.purchaseRepo.GetByID(id)
	if err != nil {
		return nil, err
	}
	if existing.Status != "pending" {
		return nil, fmt.Errorf("can only update pending purchases")
	}

	var items []models.PurchaseItem
	var total float64
	for _, item := range input.Items {
		p, err := s.productRepo.GetByID(item.ProductID)
		if err != nil {
			return nil, fmt.Errorf("product not found: %s", item.ProductID)
		}
		subtotal := float64(item.Quantity) * item.UnitCost
		total += subtotal
		items = append(items, models.PurchaseItem{
			ProductID:   item.ProductID,
			ProductName: p.Name,
			SKU:         p.SKU,
			Quantity:    item.Quantity,
			UnitCost:    item.UnitCost,
			Subtotal:    subtotal,
		})
	}

	existing.SupplierName = input.SupplierName
	existing.Items = items
	existing.TotalAmount = total
	existing.PaidAmount = input.PaidAmount
	existing.Note = input.Note
	existing.UpdatedAt = time.Now().UTC().Format(time.RFC3339)

	if err := s.purchaseRepo.Update(*existing); err != nil {
		return nil, err
	}
	return existing, nil
}

// Receive marks a purchase as received and increases stock for all items (atomic).
func (s *PurchaseService) Receive(id string) (*models.Purchase, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	purchase, err := s.purchaseRepo.GetByID(id)
	if err != nil {
		return nil, err
	}
	if purchase.Status != "pending" {
		return nil, fmt.Errorf("purchase is already %s", purchase.Status)
	}

	// Load all products
	products, err := s.productRepo.GetAll()
	if err != nil {
		return nil, err
	}

	// Apply stock increases
	productMap := make(map[string]int)
	for i, p := range products {
		productMap[p.ID] = i
	}
	for _, item := range purchase.Items {
		idx, ok := productMap[item.ProductID]
		if !ok {
			return nil, fmt.Errorf("product not found: %s", item.ProductID)
		}
		products[idx].StockQuantity += item.Quantity
		slog.Info("stock increase", "product_id", item.ProductID, "delta", item.Quantity, "reason", "purchase_received", "purchase_id", id, "ts", time.Now().UTC())
	}

	// Write all products atomically
	for _, p := range products {
		if err := s.productRepo.Update(p); err != nil {
			return nil, fmt.Errorf("update product stock: %w", err)
		}
	}

	purchase.Status = "received"
	purchase.UpdatedAt = time.Now().UTC().Format(time.RFC3339)
	if err := s.purchaseRepo.Update(*purchase); err != nil {
		return nil, err
	}
	return purchase, nil
}

// Cancel cancels a purchase. If it was received, stock is reversed.
func (s *PurchaseService) Cancel(id string) (*models.Purchase, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	purchase, err := s.purchaseRepo.GetByID(id)
	if err != nil {
		return nil, err
	}
	if purchase.Status == "cancelled" {
		return nil, fmt.Errorf("purchase is already cancelled")
	}

	if purchase.Status == "received" {
		// Reverse stock
		products, err := s.productRepo.GetAll()
		if err != nil {
			return nil, err
		}
		productMap := make(map[string]int)
		for i, p := range products {
			productMap[p.ID] = i
		}
		for _, item := range purchase.Items {
			idx, ok := productMap[item.ProductID]
			if !ok {
				continue // product may have been deleted
			}
			products[idx].StockQuantity -= item.Quantity
			if products[idx].StockQuantity < 0 {
				products[idx].StockQuantity = 0
			}
			slog.Info("stock decrease", "product_id", item.ProductID, "delta", -item.Quantity, "reason", "purchase_cancelled", "purchase_id", id, "ts", time.Now().UTC())
		}
		for _, p := range products {
			if err := s.productRepo.Update(p); err != nil {
				return nil, fmt.Errorf("update product stock: %w", err)
			}
		}
	}

	purchase.Status = "cancelled"
	purchase.UpdatedAt = time.Now().UTC().Format(time.RFC3339)
	if err := s.purchaseRepo.Update(*purchase); err != nil {
		return nil, err
	}
	return purchase, nil
}

func (s *PurchaseService) Delete(id string) error {
	purchase, err := s.purchaseRepo.GetByID(id)
	if err != nil {
		return err
	}
	if purchase.Status != "pending" {
		return fmt.Errorf("can only delete pending purchases")
	}
	return s.purchaseRepo.Delete(id)
}
