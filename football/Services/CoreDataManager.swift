//
//  CoreDataManager.swift
//  football
//
//  Created by Hyun Woo Park on 5/23/25.
//

import Foundation
import CoreData

class CoreDataManager {
    static let shared = CoreDataManager()
    
    lazy var persistentContainer: NSPersistentContainer = {
        let container = NSPersistentContainer(name: "FootballApp")
        container.loadPersistentStores { _, error in
            if let error = error {
                fatalError("CoreData 로드 실패: \(error)")
            }
        }
        return container
    }()
    
    var context: NSManagedObjectContext {
        return persistentContainer.viewContext
    }
    
    // 경기 일정 저장
    func saveFixtures(_ fixtures: [Fixture], for dateKey: String) {
        // 기존 데이터 삭제
        deleteFixtures(for: dateKey)
        
        // 새 데이터 저장
        let encoder = JSONEncoder()
        guard let fixtureData = try? encoder.encode(fixtures) else { return }
        
        let entity = NSEntityDescription.insertNewObject(forEntityName: "FixtureEntity", into: context) as! FixtureEntity
        entity.id = Int64(dateKey.hashValue)
        entity.dateKey = dateKey
        entity.fixtureData = fixtureData
        entity.timestamp = Date()
        
        saveContext()
        print("✅ CoreData에 저장 완료: \(dateKey) (\(fixtures.count)개)")
    }
    
    // 경기 일정 로드
    func loadFixtures(for dateKey: String) -> [Fixture]? {
        let fetchRequest: NSFetchRequest<FixtureEntity> = FixtureEntity.fetchRequest()
        fetchRequest.predicate = NSPredicate(format: "dateKey == %@", dateKey)
        
        do {
            let results = try context.fetch(fetchRequest)
            if let entity = results.first {
                let decoder = JSONDecoder()
                // fixtureData가 옵셔널이므로 언래핑 필요
                guard let fixtureData = entity.fixtureData else {
                    print("❌ fixtureData가 nil입니다")
                    return nil
                }
                let fixtures = try decoder.decode([Fixture].self, from: fixtureData)
                print("✅ CoreData에서 로드 완료: \(dateKey) (\(fixtures.count)개)")
                return fixtures
            }
        } catch {
            print("❌ CoreData 로드 실패: \(error)")
        }
        
        return nil
    }
    
    // 경기 일정 삭제
    func deleteFixtures(for dateKey: String) {
        let fetchRequest: NSFetchRequest<FixtureEntity> = FixtureEntity.fetchRequest()
        fetchRequest.predicate = NSPredicate(format: "dateKey == %@", dateKey)
        
        do {
            let results = try context.fetch(fetchRequest)
            for entity in results {
                context.delete(entity)
            }
            saveContext()
        } catch {
            print("❌ CoreData 삭제 실패: \(error)")
        }
    }
    
    // 오래된 캐시 정리
    func cleanupOldCache(olderThan days: Int = 7) {
        let fetchRequest: NSFetchRequest<FixtureEntity> = FixtureEntity.fetchRequest()
        let cutoffDate = Calendar.current.date(byAdding: .day, value: -days, to: Date())!
        fetchRequest.predicate = NSPredicate(format: "timestamp < %@", cutoffDate as NSDate)
        
        do {
            let results = try context.fetch(fetchRequest)
            for entity in results {
                context.delete(entity)
            }
            saveContext()
            print("✅ 오래된 캐시 정리 완료: \(results.count)개 항목 삭제")
        } catch {
            print("❌ 오래된 캐시 정리 실패: \(error)")
        }
    }
    
    // 컨텍스트 저장
    func saveContext() {
        if context.hasChanges {
            do {
                try context.save()
            } catch {
                print("❌ CoreData 저장 실패: \(error)")
            }
        }
    }
}
