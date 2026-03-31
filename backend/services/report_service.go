package services

import (
	"time"

	"premium-locks-bd/models"
	"premium-locks-bd/repository"
)

type ReportService struct {
	productRepo  repository.ProductRepository
	saleRepo     repository.SaleRepository
	purchaseRepo repository.PurchaseRepository
}

func NewReportService(productRepo repository.ProductRepository, saleRepo repository.SaleRepository, purchaseRepo repository.PurchaseRepository) *ReportService {
	return &ReportService{productRepo: productRepo, saleRepo: saleRepo, purchaseRepo: purchaseRepo}
}

type SummaryReport struct {
	TotalRevenue     float64 `json:"total_revenue"`
	TotalPurchaseCost float64 `json:"total_purchase_cost"`
	GrossProfit      float64 `json:"gross_profit"`
	TotalOrders      int     `json:"total_orders"`
	LowStockProducts int     `json:"low_stock_products"`
	TotalStockValue  float64 `json:"total_stock_value"`
}

func (s *ReportService) Summary() (*SummaryReport, error) {
	sales, err := s.saleRepo.GetAll()
	if err != nil {
		return nil, err
	}
	purchases, err := s.purchaseRepo.GetAll()
	if err != nil {
		return nil, err
	}
	products, err := s.productRepo.GetAll()
	if err != nil {
		return nil, err
	}

	var revenue, purchaseCost, stockValue float64
	for _, sale := range sales {
		if sale.Status == "completed" {
			revenue += sale.TotalAmount
		}
	}
	for _, p := range purchases {
		if p.Status == "received" {
			purchaseCost += p.TotalAmount
		}
	}
	lowStock := 0
	for _, p := range products {
		stockValue += float64(p.StockQuantity) * p.Price
		if p.StockQuantity < 10 {
			lowStock++
		}
	}

	return &SummaryReport{
		TotalRevenue:      revenue,
		TotalPurchaseCost: purchaseCost,
		GrossProfit:       revenue - purchaseCost,
		TotalOrders:       len(sales),
		LowStockProducts:  lowStock,
		TotalStockValue:   stockValue,
	}, nil
}

type DailySales struct {
	Date   string  `json:"date"`
	Total  float64 `json:"total"`
	Orders int     `json:"orders"`
}

func (s *ReportService) SalesByDateRange(from, to string) ([]DailySales, error) {
	sales, err := s.saleRepo.GetAll()
	if err != nil {
		return nil, err
	}

	daily := make(map[string]*DailySales)
	for _, sale := range sales {
		if sale.Status == "cancelled" {
			continue
		}
		date := sale.CreatedAt[:10]
		if from != "" && date < from {
			continue
		}
		if to != "" && date > to {
			continue
		}
		if _, ok := daily[date]; !ok {
			daily[date] = &DailySales{Date: date}
		}
		daily[date].Total += sale.TotalAmount
		daily[date].Orders++
	}

	result := make([]DailySales, 0, len(daily))
	for _, d := range daily {
		result = append(result, *d)
	}
	sortDailySales(result)
	return result, nil
}

type DailyPurchases struct {
	Date  string  `json:"date"`
	Total float64 `json:"total"`
	Count int     `json:"count"`
}

func (s *ReportService) PurchasesByDateRange(from, to string) ([]DailyPurchases, error) {
	purchases, err := s.purchaseRepo.GetAll()
	if err != nil {
		return nil, err
	}

	daily := make(map[string]*DailyPurchases)
	for _, p := range purchases {
		if p.Status == "cancelled" {
			continue
		}
		date := p.CreatedAt[:10]
		if from != "" && date < from {
			continue
		}
		if to != "" && date > to {
			continue
		}
		if _, ok := daily[date]; !ok {
			daily[date] = &DailyPurchases{Date: date}
		}
		daily[date].Total += p.TotalAmount
		daily[date].Count++
	}

	result := make([]DailyPurchases, 0, len(daily))
	for _, d := range daily {
		result = append(result, *d)
	}
	return result, nil
}

type StockItem struct {
	ProductID    string  `json:"product_id"`
	ProductName  string  `json:"product_name"`
	SKU          string  `json:"sku"`
	Category     string  `json:"category"`
	CurrentStock int     `json:"current_stock"`
	StockValue   float64 `json:"stock_value"`
	Status       string  `json:"status"` // "ok" | "low" | "out"
}

func (s *ReportService) StockReport() ([]StockItem, error) {
	products, err := s.productRepo.GetAll()
	if err != nil {
		return nil, err
	}

	result := make([]StockItem, 0, len(products))
	for _, p := range products {
		status := "ok"
		if p.StockQuantity == 0 {
			status = "out"
		} else if p.StockQuantity < 10 {
			status = "low"
		}
		result = append(result, StockItem{
			ProductID:    p.ID,
			ProductName:  p.Name,
			SKU:          p.SKU,
			Category:     p.Category,
			CurrentStock: p.StockQuantity,
			StockValue:   float64(p.StockQuantity) * p.Price,
			Status:       status,
		})
	}
	return result, nil
}

type TopProduct struct {
	ProductID   string  `json:"product_id"`
	ProductName string  `json:"product_name"`
	SKU         string  `json:"sku"`
	UnitsSold   int     `json:"units_sold"`
	Revenue     float64 `json:"revenue"`
}

func (s *ReportService) TopProducts() ([]TopProduct, error) {
	sales, err := s.saleRepo.GetAll()
	if err != nil {
		return nil, err
	}

	topMap := make(map[string]*TopProduct)
	for _, sale := range sales {
		if sale.Status == "cancelled" {
			continue
		}
		for _, item := range sale.Items {
			if _, ok := topMap[item.ProductID]; !ok {
				topMap[item.ProductID] = &TopProduct{
					ProductID:   item.ProductID,
					ProductName: item.ProductName,
					SKU:         item.SKU,
				}
			}
			topMap[item.ProductID].UnitsSold += item.Quantity
			topMap[item.ProductID].Revenue += item.Subtotal
		}
	}

	result := make([]TopProduct, 0, len(topMap))
	for _, t := range topMap {
		result = append(result, *t)
	}
	// Sort by units sold descending
	for i := 0; i < len(result); i++ {
		for j := i + 1; j < len(result); j++ {
			if result[j].UnitsSold > result[i].UnitsSold {
				result[i], result[j] = result[j], result[i]
			}
		}
	}
	if len(result) > 10 {
		result = result[:10]
	}
	return result, nil
}

type PaymentMethodBreakdown struct {
	Method string  `json:"method"`
	Count  int     `json:"count"`
	Total  float64 `json:"total"`
}

func (s *ReportService) PaymentMethods() ([]PaymentMethodBreakdown, error) {
	sales, err := s.saleRepo.GetAll()
	if err != nil {
		return nil, err
	}

	methods := make(map[string]*PaymentMethodBreakdown)
	for _, sale := range sales {
		if sale.Status == "cancelled" {
			continue
		}
		m := sale.PaymentMethod
		if m == "" {
			m = "unknown"
		}
		if _, ok := methods[m]; !ok {
			methods[m] = &PaymentMethodBreakdown{Method: m}
		}
		methods[m].Count++
		methods[m].Total += sale.TotalAmount
	}

	result := make([]PaymentMethodBreakdown, 0, len(methods))
	for _, v := range methods {
		result = append(result, *v)
	}
	return result, nil
}

// SalesReportRow for export
type SalesReportRow struct {
	InvoiceNumber string  `json:"invoice_number"`
	Date          string  `json:"date"`
	Customer      string  `json:"customer"`
	Items         int     `json:"items"`
	Total         float64 `json:"total"`
	Status        string  `json:"status"`
}

func (s *ReportService) SalesReport(from, to string) ([]SalesReportRow, error) {
	sales, err := s.saleRepo.GetAll()
	if err != nil {
		return nil, err
	}

	var result []SalesReportRow
	for _, sale := range sales {
		date := sale.CreatedAt[:10]
		if from != "" && date < from {
			continue
		}
		if to != "" && date > to {
			continue
		}
		result = append(result, SalesReportRow{
			InvoiceNumber: sale.InvoiceNumber,
			Date:          date,
			Customer:      sale.CustomerName,
			Items:         len(sale.Items),
			Total:         sale.TotalAmount,
			Status:        sale.Status,
		})
	}
	return result, nil
}

// PurchasesReportRow for export
type PurchasesReportRow struct {
	Date     string  `json:"date"`
	Supplier string  `json:"supplier"`
	Items    int     `json:"items"`
	Cost     float64 `json:"cost"`
	Status   string  `json:"status"`
}

func (s *ReportService) PurchasesReport(from, to string) ([]PurchasesReportRow, error) {
	purchases, err := s.purchaseRepo.GetAll()
	if err != nil {
		return nil, err
	}

	var result []PurchasesReportRow
	for _, p := range purchases {
		date := p.CreatedAt[:10]
		if from != "" && date < from {
			continue
		}
		if to != "" && date > to {
			continue
		}
		result = append(result, PurchasesReportRow{
			Date:     date,
			Supplier: p.SupplierName,
			Items:    len(p.Items),
			Cost:     p.TotalAmount,
			Status:   p.Status,
		})
	}
	return result, nil
}

// MonthlyComparison for purchase vs sales chart
type MonthlyComparison struct {
	Month     string  `json:"month"`
	Sales     float64 `json:"sales"`
	Purchases float64 `json:"purchases"`
}

func (s *ReportService) MonthlyComparison() ([]MonthlyComparison, error) {
	sales, err := s.saleRepo.GetAll()
	if err != nil {
		return nil, err
	}
	purchases, err := s.purchaseRepo.GetAll()
	if err != nil {
		return nil, err
	}

	months := make(map[string]*MonthlyComparison)
	for _, sale := range sales {
		if sale.Status == "cancelled" || len(sale.CreatedAt) < 7 {
			continue
		}
		m := sale.CreatedAt[:7]
		if _, ok := months[m]; !ok {
			months[m] = &MonthlyComparison{Month: m}
		}
		months[m].Sales += sale.TotalAmount
	}
	for _, p := range purchases {
		if p.Status == "cancelled" || len(p.CreatedAt) < 7 {
			continue
		}
		m := p.CreatedAt[:7]
		if _, ok := months[m]; !ok {
			months[m] = &MonthlyComparison{Month: m}
		}
		months[m].Purchases += p.TotalAmount
	}

	result := make([]MonthlyComparison, 0, len(months))
	for _, v := range months {
		result = append(result, *v)
	}
	sortMonthly(result)
	return result, nil
}

func sortDailySales(s []DailySales) {
	for i := 0; i < len(s); i++ {
		for j := i + 1; j < len(s); j++ {
			if s[j].Date < s[i].Date {
				s[i], s[j] = s[j], s[i]
			}
		}
	}
}

func sortMonthly(s []MonthlyComparison) {
	for i := 0; i < len(s); i++ {
		for j := i + 1; j < len(s); j++ {
			if s[j].Month < s[i].Month {
				s[i], s[j] = s[j], s[i]
			}
		}
	}
}

// ProductUpdateStock directly updates a product's stock (used by other services indirectly via repo).
func (s *ReportService) GetProductStockMap() (map[string]models.Product, error) {
	products, err := s.productRepo.GetAll()
	if err != nil {
		return nil, err
	}
	m := make(map[string]models.Product, len(products))
	for _, p := range products {
		m[p.ID] = p
	}
	return m, nil
}

// unused — kept for future: parse time range filters
func parseDate(s string) (time.Time, error) {
	return time.Parse("2006-01-02", s)
}

var _ = parseDate // suppress unused warning
