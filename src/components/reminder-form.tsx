import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export const ReminderForm = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Create New Reminder</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="protocol">Protocol</Label>
          <Select>
            <SelectTrigger id="protocol">
              <SelectValue placeholder="Select a protocol..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">Morning Sunlight Exposure</SelectItem>
              <SelectItem value="2">Cold Exposure</SelectItem>
              <SelectItem value="3">Non-Sleep Deep Rest (NSDR)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="time">Reminder Time</Label>
          <Input id="time" type="time" defaultValue="08:00" />
        </div>
        <div>
            <Button className="w-full">Save Reminder</Button>
        </div>
      </CardContent>
    </Card>
  );
};