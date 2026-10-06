package main

import (
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"time"

	"github.com/hyperledger/fabric-contract-api-go/contractapi"
)

type EHRContract struct {
	contractapi.Contract
}

type EHRRecord struct {
	RecordID         string   `json:"record_id"`
	PatientName      string   `json:"patient_name"`
	Diagnosis        string   `json:"diagnosis"`
	Medication       string   `json:"medication"`
	AttendingDoctor  string   `json:"attending_doctor"`
	ConsentedDoctors []string `json:"consented_doctors"`
	DataHash         string   `json:"data_hash"`
	CreatedAt        string   `json:"created_at"`
	LastModified     string   `json:"last_modified"`
}

// computeHash creates the SHA-256 fingerprint of a record's core fields.
// If anyone edits diagnosis/medication outside the proper channel, this hash
// will no longer match -> that's your tamper-detection mechanism (FR2/FR5).
func computeHash(recordID, patientName, diagnosis, medication string) string {
	raw := recordID + patientName + diagnosis + medication
	sum := sha256.Sum256([]byte(raw))
	return hex.EncodeToString(sum[:])
}

func (c *EHRContract) CreateEHRRecord(ctx contractapi.TransactionContextInterface, recordID string, patientName string, diagnosis string, medication string, attendingDoctor string, consentedDoctorsJSON string) error {
	exists, err := c.EHRRecordExists(ctx, recordID)
	if err != nil {
		return err
	}
	if exists {
		return fmt.Errorf("record %s already exists", recordID)
	}

	var consentedDoctors []string
	if err := json.Unmarshal([]byte(consentedDoctorsJSON), &consentedDoctors); err != nil {
		return fmt.Errorf("invalid consentedDoctors JSON: %v", err)
	}

	now := time.Now().Format(time.RFC3339)
	hash := computeHash(recordID, patientName, diagnosis, medication)

	record := EHRRecord{
		RecordID:         recordID,
		PatientName:      patientName,
		Diagnosis:        diagnosis,
		Medication:       medication,
		AttendingDoctor:  attendingDoctor,
		ConsentedDoctors: consentedDoctors,
		DataHash:         hash,
		CreatedAt:        now,
		LastModified:     now,
	}

	recordJSON, err := json.Marshal(record)
	if err != nil {
		return err
	}

	return ctx.GetStub().PutState(recordID, recordJSON)
}

func (c *EHRContract) ReadEHRRecord(ctx contractapi.TransactionContextInterface, recordID string) (*EHRRecord, error) {
	recordJSON, err := ctx.GetStub().GetState(recordID)
	if err != nil {
		return nil, fmt.Errorf("failed to read record: %v", err)
	}
	if recordJSON == nil {
		return nil, fmt.Errorf("record %s does not exist", recordID)
	}

	var record EHRRecord
	if err := json.Unmarshal(recordJSON, &record); err != nil {
		return nil, err
	}
	return &record, nil
}

func (c *EHRContract) UpdateEHRRecord(ctx contractapi.TransactionContextInterface, recordID string, diagnosis string, medication string) error {
	record, err := c.ReadEHRRecord(ctx, recordID)
	if err != nil {
		return err
	}

	record.Diagnosis = diagnosis
	record.Medication = medication
	record.LastModified = time.Now().Format(time.RFC3339)
	record.DataHash = computeHash(record.RecordID, record.PatientName, diagnosis, medication)

	recordJSON, err := json.Marshal(record)
	if err != nil {
		return err
	}
	return ctx.GetStub().PutState(recordID, recordJSON)
}

func (c *EHRContract) EHRRecordExists(ctx contractapi.TransactionContextInterface, recordID string) (bool, error) {
	recordJSON, err := ctx.GetStub().GetState(recordID)
	if err != nil {
		return false, fmt.Errorf("failed to read from world state: %v", err)
	}
	return recordJSON != nil, nil
}

// GetRecordHistory powers your Audit Trail Viewer (FR10) - Fabric tracks every
// version of a key automatically, we just expose it.
func (c *EHRContract) GetRecordHistory(ctx contractapi.TransactionContextInterface, recordID string) (string, error) {
	iterator, err := ctx.GetStub().GetHistoryForKey(recordID)
	if err != nil {
		return "", err
	}
	defer iterator.Close()

	var history []map[string]interface{}
	for iterator.HasNext() {
		resp, err := iterator.Next()
		if err != nil {
			return "", err
		}
		var record EHRRecord
		if len(resp.Value) > 0 {
			json.Unmarshal(resp.Value, &record)
		}
		history = append(history, map[string]interface{}{
			"tx_id":     resp.TxId,
			"timestamp": resp.Timestamp.AsTime(),
			"is_delete": resp.IsDelete,
			"record":    record,
		})
	}

	historyJSON, err := json.Marshal(history)
	if err != nil {
		return "", err
	}
	return string(historyJSON), nil
}