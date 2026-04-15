import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { Button } from "../../ui/button";
import { Badge } from "../../ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../ui/select";
import { Bed, Users, DoorOpen } from "lucide-react";


import { api } from "../../../lib/api";

export function Rooms() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterProperty, setFilterProperty] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const data = await api.getRooms();
        setRooms(data);
      } catch (error) {
        console.error("Failed to fetch rooms:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchRooms();
  }, []);

  if (loading) return <div className="p-8 text-center font-bold">Loading rooms...</div>;

  const filteredRooms = rooms.filter((room) => {
    const matchesProperty = filterProperty === "all" || room.property_id === Number(filterProperty);
    const matchesStatus = filterStatus === "all" || room.status === filterStatus;
    return matchesProperty && matchesStatus;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case "available":
        return "bg-green-500";
      case "partial":
        return "bg-yellow-500";
      case "full":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "available":
        return <Badge className="bg-green-500">Available</Badge>;
      case "partial":
        return <Badge className="bg-yellow-500">Partial</Badge>;
      case "full":
        return <Badge className="bg-red-500">Full</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-semibold mb-2">Rooms & Beds</h1>
        <p className="text-gray-600">Manage room allocations and bed availability</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Rooms</p>
                <p className="text-3xl font-semibold">{rooms.length}</p>
              </div>
              <DoorOpen className="w-10 h-10 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Beds</p>
                <p className="text-3xl font-semibold">
                  {rooms.reduce((acc, room) => acc + (room.capacity || 0), 0)}
                </p>
              </div>
              <Bed className="w-10 h-10 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Occupied</p>
                <p className="text-3xl font-semibold">
                  {rooms.reduce((acc, room) => acc + (room.occupied_beds || 0), 0)}
                </p>
              </div>
              <Users className="w-10 h-10 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Available Beds</p>
                <p className="text-3xl font-semibold">
                  {rooms.reduce(
                    (acc, room) => acc + ((room.capacity || 0) - (room.occupied_beds || 0)),
                    0
                  )}
                </p>
              </div>
              <Bed className="w-10 h-10 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select value={filterProperty} onValueChange={setFilterProperty}>
              <SelectTrigger>
                <SelectValue placeholder="All Properties" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Properties</SelectItem>
                <SelectItem value="1">Sunshine PG - Koramangala</SelectItem>
                <SelectItem value="2">Green Valley PG - Whitefield</SelectItem>
                <SelectItem value="3">Royal Comfort PG - HSR Layout</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger>
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="available">Available</SelectItem>
                <SelectItem value="partial">Partially Occupied</SelectItem>
                <SelectItem value="full">Fully Occupied</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Rooms Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredRooms.map((room) => (
          <Card key={room.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <DoorOpen className="w-5 h-5 text-blue-600" />
                    Room {room.number}
                  </CardTitle>
                  <p className="text-sm text-gray-600 mt-1">{room.property_name}</p>
                </div>
                {getStatusBadge(room.status)}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Bed Occupancy */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Bed Occupancy</span>
                  <span className="font-medium">
                    {room.occupied_beds}/{room.capacity}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${getStatusColor(room.status)}`}
                    style={{
                      width: `${(room.occupied_beds / room.capacity) * 100}%`,
                    }}
                  />
                </div>
              </div>

              {/* Bed Visualization */}
              <div className="flex gap-2">
                {Array.from({ length: room.capacity }, (_, i) => (
                  <div
                    key={i}
                    className={`flex-1 h-12 rounded-lg border-2 flex items-center justify-center ${i < room.occupied_beds
                        ? "bg-blue-100 border-blue-400"
                        : "bg-gray-50 border-gray-300"
                      }`}
                  >
                    <Bed
                      className={`w-5 h-5 ${i < room.occupied_beds ? "text-blue-600" : "text-gray-400"
                        }`}
                    />
                  </div>
                ))}
              </div>

              {/* Room Details */}
              <div className="space-y-2 pt-2 border-t">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Floor</span>
                  <span className="font-medium">{room.floor}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Rent per Bed</span>
                  <span className="font-medium">₹{room.rent_per_bed.toLocaleString("en-IN")}</span>
                </div>
              </div>

              {/* Amenities */}
              <div>
                <p className="text-sm text-gray-600 mb-2">Amenities</p>
                <div className="flex flex-wrap gap-2">
                  {room.amenities.split(", ").map((amenity, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {amenity}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <Button variant="outline" className="flex-1" size="sm">
                  View Details
                </Button>
                {room.status !== "full" && (
                  <Button className="flex-1" size="sm">
                    Assign Tenant
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* AI Insights */}
      <Card className="bg-gradient-to-r from-purple-600 to-indigo-700 text-white border-0">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="flex-1">
              <h3 className="font-semibold mb-2">AI Room Management Insights</h3>
              <p className="text-sm opacity-90 mb-4">
                Based on current occupancy patterns, rooms 102 and 202 have the highest turnover.
                Consider optimizing pricing or amenities for these rooms to improve retention.
                Your overall occupancy rate is strong at{" "}
                {Math.round(
                  (rooms.reduce((acc, r) => acc + (r.occupied_beds || 0), 0) /
                    (rooms.reduce((acc, r) => acc + (r.capacity || 0), 0) || 1)) *
                  100
                )}
                %.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
