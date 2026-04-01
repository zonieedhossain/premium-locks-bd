package repository

import (
	"fmt"

	"premium-locks-bd/models"
	"premium-locks-bd/storage"
)

type SaleRepository interface {
	GetAll() ([]models.Sale, error)
	GetByID(id string) (*models.Sale, error)
	Save(s models.Sale) error
	Update(s models.Sale) error
	Delete(id string) error
	GetByDateRange(from, to string) ([]models.Sale, error)
}

type jsonSaleRepo struct {
	store *storage.PartitionedJSONStore[models.Sale]
}

func NewSaleRepository(storageDir string) SaleRepository {
	return &jsonSaleRepo{
		store: storage.NewPartitionedJSONStore[models.Sale](storageDir + "/sales"),
	}
}

func (r *jsonSaleRepo) GetAll() ([]models.Sale, error) {
	items, err := r.store.ReadAll()
	if err != nil {
		return nil, err
	}
	if items == nil {
		return []models.Sale{}, nil
	}
	return items, nil
}

func (r *jsonSaleRepo) GetByID(id string) (*models.Sale, error) {
	items, err := r.store.ReadAll()
	if err != nil {
		return nil, err
	}
	for i := range items {
		if items[i].ID == id {
			return &items[i], nil
		}
	}
	return nil, fmt.Errorf("sale not found: %s", id)
}

func (r *jsonSaleRepo) Save(s models.Sale) error {
	date := "unknown"
	if len(s.CreatedAt) >= 10 {
		date = s.CreatedAt[:10]
	}
	items, err := r.store.Read(date)
	if err != nil {
		return err
	}
	items = append(items, s)
	return r.store.Write(date, items)
}

func (r *jsonSaleRepo) Update(s models.Sale) error {
	// Find the file containing this sale
	date := "unknown"
	if len(s.CreatedAt) >= 10 {
		date = s.CreatedAt[:10]
	}

	items, err := r.store.Read(date)
	if err != nil {
		return err
	}

	found := false
	for i := range items {
		if items[i].ID == s.ID {
			items[i] = s
			found = true
			break
		}
	}

	if !found {
		// Fallback: search all partitions if date was wrong or missing
		all, _ := r.store.ReadAll()
		for i := range all {
			if all[i].ID == s.ID {
				// We found it in another file. We should actually move it if dates changed, 
				// but for now let's just update it in its original file.
				originalDate := all[i].CreatedAt[:10]
				origItems, _ := r.store.Read(originalDate)
				for j := range origItems {
					if origItems[j].ID == s.ID {
						origItems[j] = s
						return r.store.Write(originalDate, origItems)
					}
				}
			}
		}
		return fmt.Errorf("sale not found: %s", s.ID)
	}

	return r.store.Write(date, items)
}

func (r *jsonSaleRepo) Delete(id string) error {
	all, err := r.store.ReadAll()
	if err != nil {
		return err
	}

	foundDate := ""
	for _, s := range all {
		if s.ID == id {
			foundDate = s.CreatedAt[:10]
			break
		}
	}

	if foundDate == "" {
		return fmt.Errorf("sale not found: %s", id)
	}

	items, err := r.store.Read(foundDate)
	if err != nil {
		return err
	}

	for i, s := range items {
		if s.ID == id {
			items = append(items[:i], items[i+1:]...)
			return r.store.Write(foundDate, items)
		}
	}

	return fmt.Errorf("sale not found in partitioned file: %s", id)
}

func (r *jsonSaleRepo) GetByDateRange(from, to string) ([]models.Sale, error) {
	items, err := r.store.ReadByRange(from, to)
	if err != nil {
		return nil, err
	}
	if items == nil {
		return []models.Sale{}, nil
	}
	return items, nil
}
