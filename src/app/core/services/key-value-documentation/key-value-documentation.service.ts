import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, BehaviorSubject } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { 
  DocumentationSet, 
  FieldDocumentation, 
  DocumentationType,
  DocumentationConfig
} from '../../../shared/types/key-value-types';

@Injectable({
  providedIn: 'root'
})
export class KeyValueDocumentationService {
  private documentationCache = new Map<DocumentationType, DocumentationSet>();
  private currentDocumentationType$ = new BehaviorSubject<DocumentationType>(DocumentationType.DEFCORE);
  
  private readonly documentationConfigs: Record<DocumentationType, DocumentationConfig> = {
    [DocumentationType.DEFCORE]: {
      type: DocumentationType.DEFCORE,
      name: 'DefCore',
      path: 'assets/documentation/defcore-fields.json',
      sections: ['DefCore', 'Physical'],
      detectionFields: {
        'DefCore': ['id', 'Version', 'Name', 'Category', 'Width', 'Height'],
        'Physical': ['Energy', 'Breath', 'Walk', 'Jump', 'Scale']
      }
    },
    [DocumentationType.ACTMAP]: {
      type: DocumentationType.ACTMAP,
      name: 'ActMap',
      path: 'assets/documentation/actmap-fields.json',
      sections: ['ActMap'],
      detectionFields: {
        'ActMap': ['Procedure', 'Length', 'Delay', 'Facet', 'NextAction']
      }
    },
    [DocumentationType.SCRIPT]: {
      type: DocumentationType.SCRIPT,
      name: 'Script',
      path: 'assets/documentation/script-fields.json',
      sections: ['Script'],
      detectionFields: {}
    },
    [DocumentationType.MATERIAL]: {
      type: DocumentationType.MATERIAL,
      name: 'Material',
      path: 'assets/documentation/material-fields.json',
      sections: ['Material'],
      detectionFields: {
        'Material': ['Density', 'Friction', 'DigFree', 'Blast2Object']
      }
    },
    [DocumentationType.CUSTOM]: {
      type: DocumentationType.CUSTOM,
      name: 'Custom',
      path: '',
      sections: [],
      detectionFields: {}
    }
  };

  constructor(private http: HttpClient) {}

  getCurrentDocumentationType(): Observable<DocumentationType> {
    return this.currentDocumentationType$.asObservable();
  }

  setCurrentDocumentationType(type: DocumentationType): void {
    this.currentDocumentationType$.next(type);
  }

  loadDocumentation(type: DocumentationType): Observable<DocumentationSet> {
    if (this.documentationCache.has(type)) {
      return of(this.documentationCache.get(type)!);
    }

    const config = this.documentationConfigs[type];
    if (!config.path) {
      const emptyDoc = { sections: {} } as DocumentationSet;
      this.documentationCache.set(type, emptyDoc);
      return of(emptyDoc);
    }

    return this.http.get<DocumentationSet>(config.path).pipe(
      map(data => {
        this.documentationCache.set(type, data);
        return data;
      }),
      catchError(error => {
        console.error(`Failed to load ${config.name} documentation:`, error);
        const emptyDoc = { sections: {} } as DocumentationSet;
        this.documentationCache.set(type, emptyDoc);
        return of(emptyDoc);
      })
    );
  }

  getFieldSuggestions(type: DocumentationType, section: string): Observable<string[]> {
    return this.loadDocumentation(type).pipe(
      map(documentation => {
        if (!documentation.sections[section]) {
          return [];
        }
        return Object.keys(documentation.sections[section].fields).sort();
      })
    );
  }

  getFieldDocumentation(type: DocumentationType, section: string, fieldKey: string): Observable<FieldDocumentation | null> {
    return this.loadDocumentation(type).pipe(
      map(documentation => {
        if (!documentation.sections[section]) {
          return null;
        }
        return documentation.sections[section].fields[fieldKey] || null;
      })
    );
  }

  getSectionDocumentation(type: DocumentationType, section: string): Observable<string> {
    return this.loadDocumentation(type).pipe(
      map(documentation => {
        if (!documentation.sections[section]) {
          return '';
        }
        return documentation.sections[section].description;
      })
    );
  }

  getAvailableSections(type: DocumentationType): string[] {
    return this.documentationConfigs[type].sections;
  }

  getDocumentationTypes(): DocumentationType[] {
    return Object.values(DocumentationType);
  }

  getDocumentationConfig(type: DocumentationType): DocumentationConfig {
    return this.documentationConfigs[type];
  }

  detectDocumentationType(content: string): DocumentationType {
    const lines = content.split('\n');
    
    // First try to detect by section headers like [DefCore], [Physical], etc.
    for (const line of lines) {
      const trimmedLine = line.trim();
      if (trimmedLine.startsWith('[') && trimmedLine.endsWith(']')) {
        const sectionName = trimmedLine.slice(1, -1);
        
        for (const [docType, config] of Object.entries(this.documentationConfigs)) {
          if (config.sections.includes(sectionName)) {
            return docType as DocumentationType;
          }
        }
      }
    }
    
    // If no section headers found, try to detect by field names
    const fieldKeys = lines
      .filter(line => line.includes('='))
      .map(line => line.split('=')[0].trim());
    
    for (const [docType, config] of Object.entries(this.documentationConfigs)) {
      if (config.detectionFields) {
        for (const [section, detectionFields] of Object.entries(config.detectionFields)) {
          const hasMatchingFields = (detectionFields as string[]).some((field: string) => fieldKeys.includes(field));
          if (hasMatchingFields) {
            return docType as DocumentationType;
          }
        }
      }
    }
    
    return DocumentationType.DEFCORE; // Default fallback
  }

  detectSection(content: string, documentationType: DocumentationType): string | null {
    const lines = content.split('\n');
    const config = this.documentationConfigs[documentationType];
    
    // Look for section headers
    for (const line of lines) {
      const trimmedLine = line.trim();
      if (trimmedLine.startsWith('[') && trimmedLine.endsWith(']')) {
        const sectionName = trimmedLine.slice(1, -1);
        if (config.sections.includes(sectionName)) {
          return sectionName;
        }
      }
    }
    
    // Try to detect by field names
    if (config.detectionFields) {
      const fieldKeys = lines
        .filter(line => line.includes('='))
        .map(line => line.split('=')[0].trim());
      
      for (const [section, detectionFields] of Object.entries(config.detectionFields)) {
        const hasMatchingFields = (detectionFields as string[]).some((field: string) => fieldKeys.includes(field));
        if (hasMatchingFields) {
          return section;
        }
      }
    }
    
    // Return first available section as default
    return config.sections[0] || null;
  }

  isFieldValid(type: DocumentationType, section: string, fieldKey: string): Observable<boolean> {
    return this.loadDocumentation(type).pipe(
      map(documentation => {
        if (!documentation.sections[section]) {
          return false;
        }
        return fieldKey in documentation.sections[section].fields;
      })
    );
  }
}