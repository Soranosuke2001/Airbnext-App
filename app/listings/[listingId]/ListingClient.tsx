"use client";

import useLoginModal from "@/app/Hooks/useLoginModal";
import Container from "@/app/components/Container";
import ListingHead from "@/app/components/Listings/ListingHead";
import ListingInfo from "@/app/components/Listings/ListingInfo";
import { categories } from "@/app/libs/categoryList";
import { SafeListing, SafeUser } from "@/app/types";
import { Reservation } from "@prisma/client";
import axios from "axios";
import { differenceInCalendarDays, eachDayOfInterval } from "date-fns";
import { useRouter } from "next/navigation";
import { FC, useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "react-hot-toast";

const initialDateRage = {
  startDate: new Date(),
  endDate: new Date(),
  key: "selection",
};

interface ListingClientProps {
  reservations?: Reservation[];
  listing: SafeListing & {
    user: SafeUser;
  };
  currentUser: SafeUser | null;
}

const ListingClient: FC<ListingClientProps> = ({
  listing,
  currentUser,
  reservations = [],
}) => {
  const loginModal = useLoginModal();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [totalPrice, setTotalPrice] = useState(listing.price);
  const [dateRange, setDateRange] = useState(initialDateRage);

  const disabledDates = useMemo(() => {
    let dates: Date[] = [];

    reservations.forEach((reservation) => {
      const range = eachDayOfInterval({
        start: new Date(reservation.startDate),
        end: new Date(reservation.endDate),
      });

      dates = [...dates, ...range];
    });

    return dates;
  }, [reservations]);

  const onCreateReservation = useCallback(async () => {
    if (!currentUser) {
      loginModal.onOpen();
      return;
    }

    setIsLoading(true);

    try {
      await axios.post("/api/reservations", {
        totalPrice,
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
        listingId: listing?.id,
      });

      toast.success("Reservation created successfully");
      setDateRange(initialDateRage);
      router.refresh();
    } catch (error) {
      toast.error("There was an error creating the reservation");
    } finally {
      setIsLoading(false);
    }
  }, [totalPrice, dateRange, listing?.id, currentUser, router, loginModal]);

  useEffect(() => {
    if (dateRange.startDate && dateRange.endDate) {
      const dayCount = differenceInCalendarDays(dateRange.endDate, dateRange.startDate);

      if (dayCount && listing.price) {
        setTotalPrice(dayCount * listing.price);
      } else {
        setTotalPrice(listing.price);
      }
    }
  }, [dateRange, listing.price]);

  const category = useMemo(() => {
    return categories.find((item) => item.label === listing.category);
  }, [listing.category]);

  return (
    <Container>
      <div className="max-w-screen-lg mx-auto">
        <div className="flex flex-col gap-8">
          <ListingHead
            id={listing.id}
            title={listing.title}
            imageSrc={listing.imageSrc}
            locationValue={listing.locationValue}
            currentUser={currentUser}
          />
          <div className="grid grid-cols-1 md:grid-cols-7 md:gap-10 mt-6">
            <ListingInfo
              user={listing.user}
              category={category}
              description={listing.description}
              roomCount={listing.roomCount}
              guestCount={listing.guestCount}
              bathroomCount={listing.bathroomCount}
              locationValue={listing.locationValue}
            />
          </div>
        </div>
      </div>
    </Container>
  );
};

export default ListingClient;
