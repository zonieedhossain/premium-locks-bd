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
	GetByDateRange(from, to string) ([]models.Invoice, error)
}

type jsonInvoiceRepo struct {
	store *storage.PartitionedJSONStore[models.Invoice]
}

func NewInvoiceRepository(storageDir string) InvoiceRepository {
	return &jsonInvoiceRepo{
		store: storage.NewPartitionedJSONStore[models.Invoice](storageDir + "/invoices"),
	}
}

func (r *jsonInvoiceRepo) GetAll() ([]models.Invoice, error) {
	items, err := r.store.ReadAll()
	if err != nil {
		return nil, err
	}
	if items == nil {
		return []models.Invoice{}, nil
	}
	return items, nil
}

func (r *jsonInvoiceRepo) GetByID(id string) (*models.Invoice, error) {
	items, err := r.store.ReadAll()
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
	date := "unknown"
	if len(inv.CreatedAt) >= 10 {
		date = inv.CreatedAt[:10]
	}
	items, err := r.store.Read(date)
	if err != nil {
		return err
	}
	items = append(items, inv)
	return r.store.Write(date, items)
}

func (r *jsonInvoiceRepo) Update(inv models.Invoice) error {
	date := "unknown"
	if len(inv.CreatedAt) >= 10 {
		date = inv.CreatedAt[:10]
	}

	items, err := r.store.Read(date)
	if err != nil {
		return err
	}

	found := false
	for i := range items {
		if items[i].ID == inv.ID {
			items[i] = inv
			found = true
			break
		}
	}

	if !found {
		all, _ := r.store.ReadAll()
		for _, item := range all {
			if item.ID == inv.ID {
				origDate := item.CreatedAt[:10]
				origItems, _ := r.store.Read(origDate)
				for j := range origItems {
					if origItems[j].ID == inv.ID {
						origItems[j] = inv
						return r.store.Write(origDate, origItems)
					}
				}
			}
		}
		return fmt.Errorf("invoice not found: %s", inv.ID)
	}

	return r.store.Write(date, items)
}

func (r *jsonInvoiceRepo) GetByDateRange(from, to string) ([]models.Invoice, error) {
	items, err := r.store.ReadByRange(from, to)
	if err != nil {
		return nil, err
	}
	if items == nil {
		return []models.Invoice{}, nil
	}
	return items, nil
}
