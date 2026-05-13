import { Star, ThumbsUp } from "lucide-react";
import { Card, CardContent, CardHeader } from "../ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "./ui/avatar";
import { Button } from "./ui/button";

interface ReviewCardProps {
  userName: string;
  userAvatar: string;
  rating: number;
  date: string;
  reviewText: string;
  helpful: number;
}

export function ReviewCard({
  userName,
  userAvatar,
  rating,
  date,
  reviewText,
  helpful
}: ReviewCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarImage src={userAvatar} alt={userName} />
              <AvatarFallback>{userName.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <h4>{userName}</h4>
              <p className="text-sm text-muted-foreground">{date}</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className="w-4 h-4"
                fill={rating >= star ? "#eab308" : "none"}
                stroke={rating >= star ? "#eab308" : "currentColor"}
              />
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm mb-4">{reviewText}</p>
        <Button variant="ghost" size="sm">
          <ThumbsUp className="w-4 h-4" />
          Helpful ({helpful})
        </Button>
      </CardContent>
    </Card>
  );
}
