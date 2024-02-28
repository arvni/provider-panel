<?php

namespace App\Mail;

use App\Models\OrderMaterial;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Attachment;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class MaterialRequested extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    private $id;

    /**
     * Create a new message instance.
     */
    public function __construct($id)
    {
        $this->id = $id;
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Material Requested',
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        $orderMaterial=OrderMaterial::query()
            ->withAggregate("User", "name")
            ->withAggregate("SampleType", "name")
            ->where("id", $this->id)->first();
        return new Content(
            view: 'Mail.material',
            with: ["orderMaterial"=>$orderMaterial]
        );
    }

    /**
     * Get the attachments for the message.
     *
     * @return array<int, Attachment>
     */
    public function attachments(): array
    {
        return [];
    }
}
