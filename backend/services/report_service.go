package services

import (
	"fmt"
	"strings"
	"time"

	"github.com/johnfercher/maroto/v2"
	"github.com/johnfercher/maroto/v2/pkg/components/col"
	"github.com/johnfercher/maroto/v2/pkg/components/row"
	"github.com/johnfercher/maroto/v2/pkg/components/text"
	"github.com/johnfercher/maroto/v2/pkg/config"
	"github.com/johnfercher/maroto/v2/pkg/consts/align"
	"github.com/johnfercher/maroto/v2/pkg/consts/fontstyle"
	"github.com/johnfercher/maroto/v2/pkg/props"
	"github.com/xuri/excelize/v2"
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
	sales, err := s.saleRepo.GetByDateRange(from, to)
	if err != nil {
		return nil, err
	}

	daily := make(map[string]*DailySales)
	for _, sale := range sales {
		if sale.Status == "cancelled" {
			continue
		}
		date := sale.CreatedAt[:10]
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
	purchases, err := s.purchaseRepo.GetByDateRange(from, to)
	if err != nil {
		return nil, err
	}

	daily := make(map[string]*DailyPurchases)
	for _, p := range purchases {
		if p.Status == "cancelled" {
			continue
		}
		date := p.CreatedAt[:10]
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

func (s *ReportService) TopProducts(from, to string) ([]TopProduct, error) {
	sales, err := s.saleRepo.GetByDateRange(from, to)
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
	sales, err := s.saleRepo.GetByDateRange(from, to)
	if err != nil {
		return nil, err
	}

	var result []SalesReportRow
	for _, sale := range sales {
		date := sale.CreatedAt
		if len(date) >= 10 {
			date = date[:10]
		}
		
		// Secondary filtering
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

	// Sort newest first
	sort.Slice(result, func(i, j int) bool {
		return result[i].Date > result[j].Date
	})

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
	purchases, err := s.purchaseRepo.GetByDateRange(from, to)
	if err != nil {
		return nil, err
	}

	var result []PurchasesReportRow
	for _, p := range purchases {
		date := p.CreatedAt
		if len(date) >= 10 {
			date = date[:10]
		}

		// Secondary filtering
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

	// Sort newest first
	sort.Slice(result, func(i, j int) bool {
		return result[i].Date > result[j].Date
	})

	return result, nil
}

func (s *ReportService) GenerateSalesCSV(from, to string) ([]byte, error) {
	rows, err := s.SalesReport(from, to)
	if err != nil {
		return nil, err
	}

	csv := "Invoice Number,Date,Customer,Items,Total,Status\n"
	for _, r := range rows {
		csv += fmt.Sprintf("%s,%s,\"%s\",%d,%.2f,%s\n", r.InvoiceNumber, r.Date, strings.ReplaceAll(r.Customer, "\"", "\"\""), r.Items, r.Total, r.Status)
	}
	return []byte(csv), nil
}

func (s *ReportService) GeneratePurchasesCSV(from, to string) ([]byte, error) {
	rows, err := s.PurchasesReport(from, to)
	if err != nil {
		return nil, err
	}

	csv := "Date,Supplier,Items,Cost,Status\n"
	for _, r := range rows {
		csv += fmt.Sprintf("%s,\"%s\",%d,%.2f,%s\n", r.Date, strings.ReplaceAll(r.Supplier, "\"", "\"\""), r.Items, r.Cost, r.Status)
	}
	return []byte(csv), nil
}

func (s *ReportService) GenerateSalesExcel(from, to string) ([]byte, error) {
	data, err := s.SalesReport(from, to)
	if err != nil {
		return nil, err
	}

	f := excelize.NewFile()
	sheet := "Sales Report"
	f.SetSheetName("Sheet1", sheet)

	// Headers
	headers := []string{"Invoice Number", "Date", "Customer", "Items", "Total", "Status"}
	for i, h := range headers {
		cell, _ := excelize.CoordinatesToCellName(i+1, 1)
		f.SetCellValue(sheet, cell, h)
	}

	// Data
	for i, r := range data {
		f.SetCellValue(sheet, fmt.Sprintf("A%d", i+2), r.InvoiceNumber)
		f.SetCellValue(sheet, fmt.Sprintf("B%d", i+2), r.Date)
		f.SetCellValue(sheet, fmt.Sprintf("C%d", i+2), r.Customer)
		f.SetCellValue(sheet, fmt.Sprintf("D%d", i+2), r.Items)
		f.SetCellValue(sheet, fmt.Sprintf("E%d", i+2), r.Total)
		f.SetCellValue(sheet, fmt.Sprintf("F%d", i+2), r.Status)
	}

	buf, _ := f.WriteToBuffer()
	return buf.Bytes(), nil
}

func (s *ReportService) GeneratePurchasesExcel(from, to string) ([]byte, error) {
	data, err := s.PurchasesReport(from, to)
	if err != nil {
		return nil, err
	}

	f := excelize.NewFile()
	sheet := "Purchases Report"
	f.SetSheetName("Sheet1", sheet)

	headers := []string{"Date", "Supplier", "Items", "Cost", "Status"}
	for i, h := range headers {
		cell, _ := excelize.CoordinatesToCellName(i+1, 1)
		f.SetCellValue(sheet, cell, h)
	}

	for i, r := range data {
		f.SetCellValue(sheet, fmt.Sprintf("A%d", i+2), r.Date)
		f.SetCellValue(sheet, fmt.Sprintf("B%d", i+2), r.Supplier)
		f.SetCellValue(sheet, fmt.Sprintf("C%d", i+2), r.Items)
		f.SetCellValue(sheet, fmt.Sprintf("D%d", i+2), r.Cost)
		f.SetCellValue(sheet, fmt.Sprintf("E%d", i+2), r.Status)
	}

	buf, _ := f.WriteToBuffer()
	return buf.Bytes(), nil
}

func (s *ReportService) GenerateStockExcel() ([]byte, error) {
	data, err := s.StockReport()
	if err != nil {
		return nil, err
	}

	f := excelize.NewFile()
	sheet := "Stock Report"
	f.SetSheetName("Sheet1", sheet)

	headers := []string{"Product Name", "SKU", "Category", "Current Stock", "Stock Value", "Status"}
	for i, h := range headers {
		cell, _ := excelize.CoordinatesToCellName(i+1, 1)
		f.SetCellValue(sheet, cell, h)
	}

	for i, r := range data {
		f.SetCellValue(sheet, fmt.Sprintf("A%d", i+2), r.ProductName)
		f.SetCellValue(sheet, fmt.Sprintf("B%d", i+2), r.SKU)
		f.SetCellValue(sheet, fmt.Sprintf("C%d", i+2), r.Category)
		f.SetCellValue(sheet, fmt.Sprintf("D%d", i+2), r.CurrentStock)
		f.SetCellValue(sheet, fmt.Sprintf("E%d", i+2), r.StockValue)
		f.SetCellValue(sheet, fmt.Sprintf("F%d", i+2), r.Status)
	}

	buf, _ := f.WriteToBuffer()
	return buf.Bytes(), nil
}

func (s *ReportService) GenerateTopProductsExcel(from, to string) ([]byte, error) {
	data, err := s.TopProducts(from, to)
	if err != nil {
		return nil, err
	}

	f := excelize.NewFile()
	sheet := "Top Products"
	f.SetSheetName("Sheet1", sheet)

	headers := []string{"Product Name", "SKU", "Units Sold", "Revenue"}
	for i, h := range headers {
		cell, _ := excelize.CoordinatesToCellName(i+1, 1)
		f.SetCellValue(sheet, cell, h)
	}

	for i, r := range data {
		f.SetCellValue(sheet, fmt.Sprintf("A%d", i+2), r.ProductName)
		f.SetCellValue(sheet, fmt.Sprintf("B%d", i+2), r.SKU)
		f.SetCellValue(sheet, fmt.Sprintf("C%d", i+2), r.UnitsSold)
		f.SetCellValue(sheet, fmt.Sprintf("D%d", i+2), r.Revenue)
	}

	buf, _ := f.WriteToBuffer()
	return buf.Bytes(), nil
}

func (s *ReportService) GenerateSalesPDF(from, to string) ([]byte, error) {
	data, err := s.SalesReport(from, to)
	if err != nil {
		return nil, err
	}
	rows := make([][]string, len(data))
	for i, r := range data {
		rows[i] = []string{r.InvoiceNumber, r.Date, r.Customer, fmt.Sprintf("%d", r.Items), fmt.Sprintf("%.2f", r.Total), r.Status}
	}
	dateRange := formatRange(from, to)
	return s.GeneratePDF("Sales Report", dateRange, []string{"Inv #", "Date", "Customer", "Items", "Total", "Status"}, rows)
}

func (s *ReportService) GeneratePurchasesPDF(from, to string) ([]byte, error) {
	data, err := s.PurchasesReport(from, to)
	if err != nil {
		return nil, err
	}
	rows := make([][]string, len(data))
	for i, r := range data {
		rows[i] = []string{r.Date, r.Supplier, fmt.Sprintf("%d", r.Items), fmt.Sprintf("%.2f", r.Cost), r.Status}
	}
	dateRange := formatRange(from, to)
	return s.GeneratePDF("Purchases Report", dateRange, []string{"Date", "Supplier", "Items", "Cost", "Status"}, rows)
}

func (s *ReportService) GenerateStockPDF() ([]byte, error) {
	data, err := s.StockReport()
	if err != nil {
		return nil, err
	}
	rows := make([][]string, len(data))
	for i, r := range data {
		rows[i] = []string{r.ProductName, r.SKU, r.Category, fmt.Sprintf("%d", r.CurrentStock), fmt.Sprintf("%.2f", r.StockValue), r.Status}
	}
	return s.GeneratePDF("Stock Report", "Full Inventory Status", []string{"Product", "SKU", "Cat.", "Stock", "Value", "Status"}, rows)
}

func (s *ReportService) GenerateTopProductsPDF(from, to string) ([]byte, error) {
	data, err := s.TopProducts(from, to)
	if err != nil {
		return nil, err
	}
	rows := make([][]string, len(data))
	for i, r := range data {
		rows[i] = []string{r.ProductName, r.SKU, fmt.Sprintf("%d", r.UnitsSold), fmt.Sprintf("%.2f", r.Revenue)}
	}
	dateRange := formatRange(from, to)
	return s.GeneratePDF("Top Products Report", dateRange, []string{"Product", "SKU", "Units", "Revenue"}, rows)
}

func (s *ReportService) GeneratePDF(title string, subtitle string, headers []string, data [][]string) ([]byte, error) {
	cfg := config.NewBuilder().Build()
	m := maroto.New(cfg)

	// Header
	m.AddRows(row.New(12).Add(
		col.New(12).Add(
			text.New(title, props.Text{Style: fontstyle.Bold, Align: align.Center, Size: 16}),
		),
	))
	if subtitle != "" {
		m.AddRows(row.New(8).Add(
			col.New(12).Add(
				text.New(subtitle, props.Text{Style: fontstyle.Italic, Align: align.Center, Size: 10, Color: &color.Color{Red: 100, Green: 100, Blue: 100}}),
			),
		))
	}
	m.AddRows(row.New(8).Add(
		col.New(12).Add(
			text.New(fmt.Sprintf("Generated on: %s", time.Now().Format("2006-01-02 15:04")), props.Text{Size: 10, Align: align.Center}),
		),
	))

	// Table Header
	headerRow := row.New(10)
	// We'll assume at most 4-5 columns for now. Let's use proportional widths.
	colWidth := 12 / len(headers)
	if colWidth == 0 {
		colWidth = 1
	}
	for _, h := range headers {
		headerRow.Add(col.New(colWidth).Add(text.New(h, props.Text{Style: fontstyle.Bold, Size: 10})))
	}
	m.AddRows(headerRow)

	// Table Data
	for _, r := range data {
		dataRow := row.New(8)
		for _, cell := range r {
			dataRow.Add(col.New(colWidth).Add(text.New(cell, props.Text{Size: 9})))
		}
		m.AddRows(dataRow)
	}

	doc, err := m.Generate()
	if err != nil {
		return nil, err
	}

	return doc.GetBytes(), nil
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

type ProfitRecord struct {
	SaleID        string  `json:"sale_id"`
	Date          string  `json:"date"`
	InvoiceNumber string  `json:"invoice_number"`
	CustomerName  string  `json:"customer_name"`
	Revenue       float64 `json:"revenue"` // sale.TotalAmount (excluding tax ? Actually total amount is what they paid)
	COGS          float64 `json:"cogs"`    // Sum(qty * cost_price)
	GrossProfit   float64 `json:"gross_profit"` // Revenue - COGS
}

	return result, nil
}

func (s *ReportService) ProfitList(from, to string) ([]ProfitRecord, error) {
	sales, err := s.saleRepo.GetAll()
	if err != nil {
		return nil, err
	}

	result := make([]ProfitRecord, 0)
	for _, sale := range sales {
		if sale.Status != "completed" {
			continue
		}
		
		date := sale.CreatedAt
		if len(date) >= 10 {
			date = date[:10]
		}
		if from != "" && date < from {
			continue
		}
		if to != "" && date > to {
			continue
		}

		var cogs float64
		for _, item := range sale.Items {
			cogs += float64(item.Quantity) * item.CostPrice
		}

		profit := sale.TotalAmount - cogs

		result = append(result, ProfitRecord{
			SaleID:        sale.ID,
			Date:          date,
			InvoiceNumber: sale.InvoiceNumber,
			CustomerName:  sale.CustomerName,
			Revenue:       sale.TotalAmount, // total amount the customer was charged (after discounts, etc)
			COGS:          cogs,
			GrossProfit:   profit,
		})
	}

	// Sort newest first
	for i := 0; i < len(result); i++ {
		for j := i + 1; j < len(result); j++ {
			if result[j].Date > result[i].Date {
				result[i], result[j] = result[j], result[i]
			}
		}
	}

	return result, nil
}

func (s *ReportService) GenerateProfitPDF(from, to string) ([]byte, error) {
	data, err := s.ProfitList(from, to)
	if err != nil {
		return nil, err
	}
	rows := make([][]string, len(data))
	for i, r := range data {
		rows[i] = []string{r.Date, r.InvoiceNumber, r.CustomerName, fmt.Sprintf("%.2f", r.Revenue), fmt.Sprintf("%.2f", r.COGS), fmt.Sprintf("%.2f", r.GrossProfit)}
	}
	dateRange := formatRange(from, to)
	return s.GeneratePDF("Profit Report", dateRange, []string{"Date", "Inv #", "Customer", "Revenue", "COGS", "Profit"}, rows)
}

func formatRange(from, to string) string {
	if from == "" && to == "" {
		return "Full Period"
	}
	if from != "" && to == "" {
		return fmt.Sprintf("From %s", from)
	}
	if from == "" && to != "" {
		return fmt.Sprintf("Until %s", to)
	}
	return fmt.Sprintf("Period: %s to %s", from, to)
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
