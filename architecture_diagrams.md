# Predictifi.AI - System Architecture & Block Diagrams

Here are two professional flowcharts documenting your exact project. You can take a screenshot of these directly for your PowerPoint presentation!

### 1. High-Level System Architecture (Block Diagram)
This diagram shows the complete full-stack environment, broken down into its 4 main layers: Frontend, Backend API, Machine Learning Engine, and Data.

```mermaid
flowchart TB
    classDef frontend fill:#1e40af,stroke:#60a5fa,stroke-width:2px,color:#fff,rx:8px,ry:8px;
    classDef backend fill:#065f46,stroke:#34d399,stroke-width:2px,color:#fff,rx:8px,ry:8px;
    classDef ml fill:#4c1d95,stroke:#a78bfa,stroke-width:2px,color:#fff,rx:8px,ry:8px;
    classDef data fill:#9f1239,stroke:#fb7185,stroke-width:2px,color:#fff,rx:8px,ry:8px;

    subgraph User Layer [GUI Frontend]
        Vite[Vite + React.js]:::frontend
        Tailwind[Tailwind CSS & 3D WebGL]:::frontend
        Recharts[Recharts Interactive Graphs]:::frontend
    end

    subgraph API Layer [Python Server]
        Flask[Flask REST API Endpoints]:::backend
        CORS[CORS Security & Routing]:::backend
    end

    subgraph AI Engine [Machine Learning]
        FeatureEng[Feature Engineering: RSI, MACD, SMA]:::ml
        RF[Random Forest Regressor 100 Trees]:::ml
        Predict[Multi-Horizon Trajectory Generator]:::ml
    end

    subgraph Data Sources [Data Layer]
        YFinance[Live Yahoo Finance API Auto-Updater]:::data
        CSV[(Local Offline CSV Datasets)]:::data
        Supabase[(Supabase User Authentication)]:::data
    end

    %% Connections
    Vite <--> Supabase
    Vite <-->|HTTP POST /api/predict| Flask
    Tailwind --- Vite
    Recharts --- Vite
    
    Flask <--> FeatureEng
    FeatureEng --> RF
    RF --> Predict
    Predict -->|Returns JSON Payload| Flask
    
    FeatureEng <-- Fetches Target Pricing --> CSV
    CSV <-->|Downloads Missing Days| YFinance

```

***

### 2. Live Prediction Request Cycle (Flowchart)
This flowchart describes the exact step-by-step logic the system executes when a user clicks the "Initiate Sequence" button on your frontend. 

```mermaid
sequenceDiagram
    participant U as User (Browser)
    participant F as React Frontend
    participant API as Flask Backend
    participant ML as AI & Data Engine
    participant YF as Yahoo Finance

    U->>F: Selects Stock (AAPL) & T+3 Horizon
    F->>F: Triggers "Aggregating..." Loading State
    F->>API: HTTP POST /api/predict {symbol: AAPL, horizon: 3d}
    
    API->>ML: Initialize Data Fetch (fetch_data)
    ML->>ML: Check Local CSV (dataset_AAPL.csv)
    ML->>YF: Are there missing trading days?
    YF-->>ML: Downloads missing days (if online)
    ML->>ML: Appends to CSV & Loads DataFrame
    
    API->>ML: Initialize Feature Engineering
    ML->>ML: Calculate RSI, MACD, SMA_10, SMA_50
    ML->>ML: Clean NaN / Gap Values
    
    API->>ML: Train Random Forest Regressor
    ML->>ML: Fit 100 Decision Trees (Chronological Split)
    ML->>ML: Eval MAPE -> Calculate Confidence %
    ML->>ML: Predict T+3 Trajectory Steps
    
    ML-->>API: Result Payload (Accuracy, Predictions, History)
    API-->>F: Return JSON Package (200 OK)
    
    F->>F: Updates UI State (Removes Spinner)
    F->>U: Renders Recharts Graph & Telemetry Card
```
