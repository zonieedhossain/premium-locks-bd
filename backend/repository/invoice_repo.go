package repository

import (
	"fmt"

	"premium-locks-bd/models"
	"premium-locks-bd/storage"
)

type InvoiceRepository interface {
	GetAll() ([]models.Invoice, error)
	GetByID(id string) (*models.Invoice, error)
	Save(inv models.Invoice) error
	Update(inv models.Invoice) error
}

type jsonInvoiceRepo struct {
	store *storage.JSONStore[models.Invoice]
}

func NewInvoiceRepository(storageDir string) InvoiceRepository {
	return &jsonInvoiceRepo{
		store: storage.NewJSONStore[models.Invoice](storageDir + "/invoices.json"),
	}
}

func (r *jsonInvoiceRepo) GetAll() ([]models.Invoice, error) {
	items, err := r.store.Read()
	if err != nil {
		return nil, err
	}
	if items == nil {
		return []models.Invoice{}, nil
	}
	return items, nil
}

func (r *jsonInvoiceRepo) GetByID(id string) (*models.Invoice, error) {
	items, err := r.store.Read()
	if err != nil {
		return nil, err
	}
	for i := range items {
		if items[i].ID == id {
			return &items[i], nil
		}
	}
	return nil, fmt.Errorf("invoice not found: %s", id)
}

func (r *jsonInvoiceRepo) Save(inv models.Invoice) error {
	items, err := r.store.Read()
	if err != nil {
		return err
	}
	items = append(items, inv)
	return r.store.Write(items)
}

func (r *jsonInvoiceRepo) Update(inv models.Invoice) error {
	items, err := r.store.Read()
	if err != nil {
		return err
	}
	for i := range items {
		if items[i].ID == inv.ID {
			items[i] = inv
			return r.store.Write(items)
		}
	}
	return fmt.Errorf("invoice not found: %s", inv.ID)
}
