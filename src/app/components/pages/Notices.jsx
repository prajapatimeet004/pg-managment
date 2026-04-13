import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Bell, AlertTriangle, Plus, Calendar } from "lucide-react";


import { api } from "../../lib/api";

export function Notices() {
  const [notices, setNotices] = useState([]);
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [noticesData, propertiesData] = await Promise.all([
          api.getNotices(),
          api.getProperties()
        ]);
        setNotices(noticesData);
        setProperties(propertiesData);
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <div className="p-8 text-center font-bold">Loading notices...</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold mb-2">Notice Board</h1>
          <p className="text-gray-600 font-medium">Communicate with all tenants across locations</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-xl h-12 shadow-md">
              <Plus className="w-4 h-4 mr-2" />
              Post Notice
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md rounded-[2rem]">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold">Post New Notice</DialogTitle>
            </DialogHeader>
            <form
              className="space-y-4"
              onSubmit={async (e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const propertyIdField = formData.get("property_id");
                
                let propId = 0;
                let propName = "All Properties";
                
                if (propertyIdField !== "all") {
                  propId = parseInt(propertyIdField);
                  const prop = properties.find(p => p.id === propId);
                  propName = prop?.name || "Unknown";
                }

                const noticeData = {
                  title: formData.get("title"),
                  content: formData.get("content"),
                  property_id: propId,
                  property_name: propName,
                  urgent: (e.currentTarget.querySelector("#urgent")).checked,
                  created_by: "Manager",
                  created_at: new Date().toISOString()
                };

                try {
                  const newNotice = await api.createNotice(noticeData);
                  setNotices(prev => [newNotice, ...prev]);
                  setIsAddDialogOpen(false);
                } catch (error) {
                  console.error("Failed to post notice:", error);
                }
              }}
            >
              <div className="space-y-2">
                <Label htmlFor="title" className="text-xs font-bold uppercase text-muted-foreground tracking-widest ml-1">Notice Title</Label>
                <Input id="title" name="title" placeholder="e.g., Water Supply Update" className="h-12 rounded-xl bg-gray-50 border-none" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="property" className="text-xs font-bold uppercase text-muted-foreground tracking-widest ml-1">Property</Label>
                <Select name="property_id" defaultValue="all">
                  <SelectTrigger className="h-12 rounded-xl bg-gray-50 border-none">
                    <SelectValue placeholder="Select property" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-none shadow-xl">
                    <SelectItem value="all">All Properties</SelectItem>
                    {properties.map(p => (
                      <SelectItem key={p.id} value={p.id.toString()}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="content" className="text-xs font-bold uppercase text-muted-foreground tracking-widest ml-1">Notice Content</Label>
                <Textarea id="content" name="content" placeholder="Enter notice details..." className="rounded-xl bg-gray-50 border-none" rows={4} required />
              </div>
              <div className="flex items-center gap-3 p-2 bg-gray-50 rounded-xl">
                <input type="checkbox" id="urgent" className="w-5 h-5 rounded-md accent-rose-600" />
                <Label htmlFor="urgent" className="cursor-pointer font-bold text-sm">
                  Mark Priority / Urgent
                </Label>
              </div>
              <Button type="submit" className="w-full h-14 rounded-2xl font-bold bg-primary shadow-lg shadow-primary/10 mt-2">
                Post Now
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary */}
      <Card className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white border-0">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <Bell className="w-6 h-6 mt-1 flex-shrink-0" />
            <div>
              <h3 className="font-semibold mb-2">Notice Board Tips</h3>
              <p className="text-sm opacity-90">
                Post important announcements, maintenance schedules, and updates for your tenants.
                Urgent notices are highlighted and sent via WhatsApp/SMS automatically.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notices List */}
      <div className="space-y-4">
        {notices
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .map((notice) => (
            <Card
              key={notice.id}
              className={`hover:shadow-lg transition-shadow ${notice.urgent ? "border-l-4 border-l-red-500" : ""
                }`}
            >
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <CardTitle className="text-xl">{notice.title}</CardTitle>
                      {notice.urgent && (
                        <Badge variant="destructive" className="flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          Urgent
                        </Badge>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600">
                      <Badge variant="outline">{notice.property_name}</Badge>
                      <span>•</span>
                      <span>By {notice.created_by}</span>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-700">{notice.content}</p>
                <div className="flex items-center justify-between text-sm text-gray-600 pt-2 border-t">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    <span>
                      Posted on{" "}
                      {new Date(notice.created_at).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm">
                      Edit
                    </Button>
                    <Button variant="ghost" size="sm" className="text-red-600">
                      Delete
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
      </div>

      {notices.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">No notices posted yet</p>
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Post Your First Notice
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
