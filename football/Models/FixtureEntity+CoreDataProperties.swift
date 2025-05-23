//
//  FixtureEntity+CoreDataProperties.swift
//  football
//
//  Created by Hyun Woo Park on 5/23/25.
//
//

import Foundation
import CoreData


extension FixtureEntity {

    @nonobjc public class func fetchRequest() -> NSFetchRequest<FixtureEntity> {
        return NSFetchRequest<FixtureEntity>(entityName: "FixtureEntity")
    }

    @NSManaged public var dateKey: String?
    @NSManaged public var fixtureData: Data?
    @NSManaged public var id: Int64
    @NSManaged public var timestamp: Date?

}

extension FixtureEntity : Identifiable {

}
